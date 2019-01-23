const { declareInjections } = require('@cardstack/di');
const { get, sortBy } = require('lodash');
const { utils: { BN } } = require('web3');
const moment = require('moment-timezone');
const Session = require('@cardstack/plugin-utils/session');
const log = require('@cardstack/logger')('portfolio/asset-history/history-indexer');
const { updateBalanceFromTransaction } = require('portfolio-utils');
const DEFAULT_MAX_ASSET_HISTORIES = 1000000;

let indexJobNumber = 0;
let historyValueNonce = 0;

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

    async start({ assetContentTypes, transactionContentTypes, maxAssetHistories, mockNow }) {
      log.debug(`starting history-indexer`);
      await this._setupPromise;

      this.assetContentTypes = assetContentTypes;
      this.transactionContentTypes = transactionContentTypes;
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
          result = await this.searchers.getFromControllingBranch(Session.INTERNAL_PRIVILEGED, asset.type, asset.id, ['transactions']);
        } catch (e) {
          if (e.status !== 404) { throw e; }
        }
        await this._processAsset(result.data, result.included);
      } else {
        let { transactions=[], assets=[] } = await this._getAssets() || {};
        for (asset of assets) {
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
        let { type, doc: { data: resource } } = evt;
        if (!this.assetContentTypes || !this.transactionContentTypes) { return; }

        if (this.assetContentTypes.includes(type)) {
          log.debug(`index add event for asset ${resource.type}/${resource.id} has been detected, triggering asset history indexing for this asset.`);
          this._eventProcessingPromise = Promise.resolve(this._eventProcessingPromise)
            .then(() => this.index({ asset:resource }));
        }

        return await this._eventProcessingPromise;
      });
      log.debug(`completed setting up event listeners for asset updates`);
    }

    async _processAsset(asset, includedTransactions) {
      if (get(asset, 'meta.loadingTransactions')) { return; }
      if (get(asset, 'meta.abortLoadingBlockheight')) { return; }

      const today = moment().utc().format('YYYY-MM-DD');
      let transactions = getTransactionsFromAssetIncludeds(asset, includedTransactions);

      await this._buildAssetHistory({ today, asset, transactions });
    }

    async _getAssets() {
      if (!this.assetContentTypes) { return; }

      let size = this.maxAssetHistories || DEFAULT_MAX_ASSET_HISTORIES;
      let { data: assets } = await this.searchers.searchFromControllingBranch(Session.INTERNAL_PRIVILEGED, {
        filter: {
          type: { exact: this.assetContentTypes }
        },
        page: { size }
      });
      let transactionIds = assets.reduce((cumulativeTransactions, asset) => {
        return cumulativeTransactions.concat((get(asset, 'relationships.transactions.data') || []).map(i => i.id).filter(i => Boolean(i)));
      } , []);
      let { data: transactions } = await this.searchers.searchFromControllingBranch(Session.INTERNAL_PRIVILEGED, {
        filter: {
          type: { exact: this.transactionContentTypes },
          id: { exact: transactionIds }

        },
        page: { size }
      });

      return { assets, transactions };
    }

    async _buildAssetHistory({ today, asset, transactions }) {
      let historyValues = await this._buildHistoryValues(today, asset, transactions);

      let batch = this.pgsearchClient.beginBatch(this.schema, this.searchers);
      for (let historyValue of historyValues) {
        await this._indexResource(batch, historyValue);
      }

      let assetHistory = {
        type: 'asset-histories',
        id: asset.id.toLowerCase(),
        relationships: {
          asset: { data: { type: asset.type, id: asset.id } },
          'history-values': {
            data: historyValues.map(({ id, type }) => {
              return { type, id };
            })
          }
        }
      };

      await this._indexResource(batch, assetHistory);
      await batch.done();
    }

    async _buildHistoryValues(today, asset, transactions=[]) {
      let successfulTransactions = transactions.filter(txn => get(txn, 'attributes.transaction-successful'));
      if (!successfulTransactions || !successfulTransactions.length) { return []; }

      let historyValues = [];
      let historyStartDate = moment(successfulTransactions[0].attributes.timestamp, 'X').utc().startOf('day');
      let daysOfHistory = moment(today, 'YYYY-MM-DD').utc().diff(historyStartDate, 'days');

      for (let i = 0; i <= daysOfHistory; i++) {
        let timestamp = moment(historyStartDate, 'YYYY-MM-DD').utc().startOf('day').add(i, 'day').valueOf();
        historyValues.push(buildHistoryValue({ asset, timestamp }));
      }
      for (let transaction of successfulTransactions) {
        historyValues.push(buildHistoryValue({ asset, transaction }));
      }
      historyValues = sortBy(historyValues, [ 'attributes.timestamp', 'id']);

      let balance = new BN(0);
      for (let historyValue of historyValues) {
        let transaction;
        let transactionId = get(historyValue, 'relationships.transaction.data.id');
        let transactionType = get(historyValue, 'relationships.transaction.data.type');
        if (transactionId && transactionType && (transaction = successfulTransactions.find(i => i.id === transactionId && i.type === transactionType))) {
          balance = updateBalanceFromTransaction(balance, asset.id, transaction);
        }

        historyValue.attributes.balance = balance.toString();
      }
      return historyValues;
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

function buildHistoryValue({ asset, transaction, timestamp }) {
  let transactionUnixTime = get(transaction, 'attributes.timestamp');
  timestamp = transactionUnixTime ? transactionUnixTime * 1000 : timestamp;
  let transactionRelationship = transaction ? { type: transaction.type, id: transaction.id } : null;
  return {
    id: `${asset.id}_${timestamp}_${historyValueNonce++}`,
    type: 'asset-history-values',
    attributes: { 'timestamp-ms': timestamp },
    relationships: {
      asset: { data: { type: asset.type, id: asset.id } },
      transaction: { data: transactionRelationship }
    }
  };
}
