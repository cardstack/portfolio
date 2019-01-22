const { declareInjections } = require('@cardstack/di');
const { differenceBy, get, groupBy, sortBy } = require('lodash');
const { utils: { BN } } = require('web3');
const moment = require('moment-timezone');
const Session = require('@cardstack/plugin-utils/session');
const log = require('@cardstack/logger')('portfolio/asset-history/history-indexer');
const { updateBalanceFromTransaction } = require('portfolio-utils');
const DEFAULT_MAX_ASSET_HISTORIES = 1000000;

let indexJobNumber = 0;

module.exports = declareInjections({
  controllingBranch: 'hub:controlling-branch',
  searchers: 'hub:searchers',
  schema: 'hub:current-schema',
  pgsearchClient: `plugin-client:${require.resolve('@cardstack/pgsearch/client')}`
},

  class HistoryIndexer {
    static create(...args) {
      return new this(...args);
    }

    constructor({ pgsearchClient, schema, searchers, controllingBranch }) {
      this.searchers = searchers;
      this.schema = schema;
      this.pgsearchClient = pgsearchClient;
      this.controllingBranch = controllingBranch;
      this._setupPromise = this._ensureClient();
      this._boundEventListeners = false;
      this._indexingPromise = null; // this is exposed to the tests
      this._eventProcessingPromise = null; // this is exposed to the tests
      this._startedPromise = new Promise(res => this._hasStartedCallBack = res);
    }

    async start({ assetContentTypes, maxAssetHistories, mockNow }) {
      log.debug(`starting history-indexer`);
      await this._setupPromise;

      this.assetContentTypes = assetContentTypes;
      this.maxAssetHistories = maxAssetHistories;
      if (process.env.HUB_ENVIRONMENT === 'test' && mockNow) {
        moment.now = function() {
          return mockNow;
        };
      }

      await this._startAssetHistoryListening();

      this._hasStartedCallBack();
      log.debug(`completed history-indexer startup`);
    }

    async ensureStarted() {
      log.debug(`ensuring history-indexer has started`);
      await this._setupPromise;
      await this._startedPromise;
      log.debug(`completed ensuring history-indexer has started`);
    }

    async _ensureClient() {
      log.debug(`waiting for pgsearch client to start`);
      await this.pgsearchClient.ensureDatabaseSetup();
      log.debug(`completed pgsearch client startup`);
    }

    async index(opts = {}) {
      opts.jobNumber = indexJobNumber++;
      log.debug(`queuing index job for ${JSON.stringify(opts)}`);

      this._indexingPromise = Promise.resolve(this._indexingPromise)
        .then(() => this._index(opts));

      return await this._indexingPromise;
    }

    async _index(opts) {
      await this.ensureStarted();

      if (process.env.HUB_ENVIRONMENT === 'test' && opts.mockNow) {
        moment.now = function() {
          return opts.mockNow;
        };
      }

      let { asset } = opts;
      if (asset) {
        let result;
        try {
          result = await this.searchers.getFromControllingBranch(Session.INTERNAL_PRIVILEGED, asset.type, asset.id);
        } catch (e) {
          if (e.status !== 404) { throw e; }
        }
        await this._processAsset(result.data, result.included);
      } else {
        let { included=[], data: assets=[] } = await this._getAssets() || {};
        for (asset of assets) {
          let transactionsIdentifiers = (get(asset, 'relationships.transactions.data') || []).map(i => `${i.type}/${i.id}`);
          let transactions = included.filter(i => transactionsIdentifiers.includes(`${i.type}/${i.id}`));
          await this._processAsset(asset, transactions);
        }
      }
    }

    async _startAssetHistoryListening() {
      if (this._boundEventListeners) { return; }

      log.debug(`starting indexing event listeners for asset updates`);
      this._boundEventListeners = true;
      if (!this.assetContentTypes || !this.assetContentTypes.length) { return; }

      this.pgsearchClient.on('add', async (evt) => {
        let { type, doc: { data: asset } } = evt;
        if (!this.assetContentTypes || !this.assetContentTypes.includes(type)) { return; }

        log.debug(`index add event for asset ${asset.type}/${asset.id} has been detected, triggering asset history indexing for this asset.`);
        this._eventProcessingPromise = Promise.resolve(this._eventProcessingPromise)
          .then(() => this.index({ asset }));

        return await this._eventProcessingPromise;
      });
      log.debug(`completed setting up event listeners for asset updates`);
    }

    async _processAsset(asset, includedTransactions) {
      if (get(asset, 'meta.loadingTransactions')) { return; }
      if (get(asset, 'meta.abortLoadingBlockheight')) { return; }

      const today = moment().utc().format('YYYY-MM-DD');
      let transactions = getTransactionsFromAssetIncludeds(asset, includedTransactions);
      let { included = [], data: assetHistories } = await this.searchers.searchFromControllingBranch(Session.INTERNAL_PRIVILEGED, {
        filter: {
          type: { exact: 'asset-histories' },
          'asset.id': { exact: asset.id },
          'asset.type': { exact: asset.type }
        }
      });
      let [assetHistory] = assetHistories;

      if (!assetHistory) {
        await this._buildAssetHistory({ today, asset, transactions });
      } else {
        let historyValueIds = (get(assetHistory, 'relationships.history-values.data') || []).map(i => i.id);
        let historyValues = included.filter(i => historyValueIds.includes(i.id));
        await this._buildAssetHistory({ today, asset, assetHistory, transactions, historyValueIds, historyValues });
      }
    }

    async _getAssets() {
      if (!this.assetContentTypes) { return; }

      let size = this.maxAssetHistories || DEFAULT_MAX_ASSET_HISTORIES;
      return await this.searchers.searchFromControllingBranch(Session.INTERNAL_PRIVILEGED, {
        filter: {
          type: { exact: this.assetContentTypes }
        },
        page: { size }
      });
    }

    async _buildAssetHistory({ today, asset, assetHistory, transactions, historyValueIds = [], historyValues = [] }) {
      let updatedLastHistoryValues = await this._buildHistoryValues(today, asset, transactions, historyValueIds, historyValues);

      let batch = this.pgsearchClient.beginBatch(this.schema, this.searchers);
      for (let historyValue of updatedLastHistoryValues) {
        await this._indexResource(batch, historyValue);
      }

      let updatedHistoryRelationships = historyValueIds.map(id => {
        return { type: 'asset-history-values', id };
      });
      for (let { type, id } of updatedLastHistoryValues) {
        if (historyValueIds.includes(id)) { continue; }
        updatedHistoryRelationships.push({ type, id });
      }

      if (!assetHistory) {
        assetHistory = {
          type: 'asset-histories',
          id: asset.id.toLowerCase(),
          attributes: {
            'last-update-timestamp': moment().utc().unix()
          },
          relationships: {
            asset: { data: { type: asset.type, id: asset.id } },
            'history-values': { data: [] }
          }
        };
      }
      assetHistory.relationships['history-values'] = assetHistory.relationships['history-values'] || {};
      assetHistory.relationships['history-values'].data = updatedHistoryRelationships;
      await this._indexResource(batch, assetHistory);
      await batch.done();
    }

    async _buildHistoryValues(today, asset, transactions, historyValueIds = [], historyValues = []) {
      let updatedLastHistoryValues = [];
      if (!transactions || !transactions.length) { return []; }

      let historyStartDate = moment(transactions[0].attributes.timestamp, 'X').utc().format('YYYY-MM-DD');
      let transactionsByDate = groupBy(transactions, t => moment(t.attributes.timestamp, 'X').utc().format('YYYY-MM-DD'));
      let lastHistoryValue = historyValues.find(i => i.id === historyValueIds[historyValueIds.length - 1]);
      let beginNewValuesDate = lastHistoryValue ? lastHistoryValue.attributes['gmt-date'] : historyStartDate;
      let daysToAdd = moment(today, 'YYYY-MM-DD').utc().diff(moment(beginNewValuesDate, 'YYYY-MM-DD').utc(), 'days');

      let balance = lastHistoryValue ? new BN(lastHistoryValue.attributes.balance) : new BN(0);
      for (let i = 0; i <= daysToAdd; i++) {
        let date = moment(beginNewValuesDate, 'YYYY-MM-DD').utc().add(i, 'day').format('YYYY-MM-DD');
        let transactionsForThisDate = transactionsByDate[date];

        if (lastHistoryValue && lastHistoryValue.attributes['gmt-date'] === date) {
          let unprocessedTransactions =
            differenceBy(transactionsForThisDate,
              (get(lastHistoryValue, 'relationships.transactions.data') || []), 'id');
          balance = (unprocessedTransactions || []).reduce((cumulativeBalance, t) =>
            updateBalanceFromTransaction(cumulativeBalance, asset.id, t), balance);
        } else {
          balance = (transactionsForThisDate || []).reduce((cumulativeBalance, t) =>
            updateBalanceFromTransaction(cumulativeBalance, asset.id, t), balance);
        }

        let historyValue = {
          id: `${asset.id}_${date}`,
          type: 'asset-history-values',
          attributes: {
            balance: balance.toString(),
            'gmt-date': date,
          },
          relationships: {
            asset: { data: { type: asset.type, id: asset.id } },
            transactions: { data: transactionRelationshipsForDate(transactionsByDate, date) }
          }
        };
        updatedLastHistoryValues.push(historyValue);
      }
      return updatedLastHistoryValues;
    }

    async _indexResource(batch, record) {
      log.trace('indexing model %j', record);
      await batch.saveDocument(await this._createDocumentContext(record));
    }

    async _createDocumentContext(record) {
      let { id, type } = record;
      let schema = await this.schema.forControllingBranch();
      let contentType = schema.types.get(type);
      let sourceId = contentType.dataSource.id;
      return this.searchers.createDocumentContext({
        id,
        type,
        branch: this.controllingBranch.name,
        schema,
        sourceId,
        upstreamDoc: { data: record }
      });
    }
  });

function getTransactionsFromAssetIncludeds(asset, included=[]) {
  let transactions = get(asset, 'relationships.transactions.data');
  if (!transactions || !transactions.length) { return []; }

  let relatedTransactions = transactions.map(t => `${t.type}/${t.id}`);

  let results = included.filter(i => relatedTransactions.includes(`${i.type}/${i.id}`));
  return results;
}

function transactionRelationshipsForDate(transactionsByDate, date) {
  let result = sortBy((transactionsByDate[date] || []), ['attributes.timestamp', 'attributes.transaction-index'])
    .map(({ type, id }) => {
      return { type, id };
    });
  return result;
}