const { declareInjections } = require('@cardstack/di');
const { get, sortBy, uniqBy } = require('lodash');
const { utils: { BN } } = require('web3');
const moment = require('moment-timezone');
const Session = require('@cardstack/plugin-utils/session');
const log = require('@cardstack/logger')('portfolio/asset-history/history-indexer');
const { updateBalanceFromTransaction } = require('portfolio-utils');
const DEFAULT_MAX_ASSET_HISTORIES = 1000000;

let indexJobNumber = 0;

module.exports = declareInjections({
  searchers: 'hub:searchers',
  schema: 'hub:current-schema',
  pgsearchClient: `plugin-client:${require.resolve('@cardstack/pgsearch/client')}`,
  transactionIndex: `plugin-client:${require.resolve('@cardstack/ethereum/cardstack/transaction-index')}`,
},

  class HistoryIndexer {
    static create(...args) {
      return new this(...args);
    }

    constructor({ pgsearchClient, schema, searchers, transactionIndex }) {
      this.searchers = searchers;
      this.schema = schema;
      this.pgsearchClient = pgsearchClient;
      this.transactionIndex = transactionIndex;
      this._boundEventListeners = false;
      this._indexingPromise = null; // this is exposed to the tests
      this._eventProcessingPromise = null; // this is exposed to the tests
    }

    async start({ assetContentTypes, transactionContentTypes, maxAssetHistories, mockNow }) {
      log.debug(`starting history-indexer`);

      log.debug(`waiting for pgsearch client to start`);
      await this.pgsearchClient.ensureDatabaseSetup();
      log.debug(`completed pgsearch client startup`);

      this.assetContentTypes = assetContentTypes;
      this.transactionContentTypes = transactionContentTypes;
      this.maxAssetHistories = maxAssetHistories;
      if (process.env.HUB_ENVIRONMENT === 'test' && mockNow) {
        moment.now = function() {
          return mockNow;
        };
      }

      this._startListeningForAssetHistory();
      log.debug(`completed history-indexer startup`);
    }

    async index(opts = {}) {
      opts.jobNumber = indexJobNumber++;
      log.debug(`queuing index job for ${JSON.stringify(opts)}`);

      this._indexingPromise = Promise.resolve(this._indexingPromise)
        .then(() => this._index(opts));

      return await this._indexingPromise;
    }

    async _index({ lastBlockHeight, asset, mockNow }) {
      if (process.env.HUB_ENVIRONMENT === 'test' && mockNow) {
        moment.now = function() {
          return mockNow;
        };
      }

      if (asset) {
        let result;
        try {
          result = await this.searchers.get(Session.INTERNAL_PRIVILEGED, 'local-hub', asset.type, asset.id, ['transactions']);
        } catch (e) {
          if (e.status !== 404) { throw e; }
        }
        if (result && result.data) {
          await this._processAsset(result.data, result.included);
        }
      } else {
        let { transactions=[], assets=[] } = await this._getAssets(lastBlockHeight) || {};
        for (asset of assets) {
          await this._processAsset(asset, transactions);
        }
      }

      return this.transactionIndex.blockHeight;
    }

    _startListeningForAssetHistory() {
      if (this._boundEventListeners) { return; }

      log.debug(`starting indexing event listeners for asset updates`);
      this._boundEventListeners = true;
      if (!this.assetContentTypes || !this.assetContentTypes.length) { return; }

      this.pgsearchClient.on('add', evt => {
        let { type, doc: { data: resource } } = evt;
        if (!this.assetContentTypes) { return; }

        if (this.assetContentTypes.includes(type)) {
          log.debug(`index add event for asset ${resource.type}/${resource.id} has been detected, triggering asset history indexing for this asset.`);
          this._eventProcessingPromise = Promise.resolve(this._eventProcessingPromise)
            .then(() => this.index({ asset:resource }));
        }
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

    async _getAssets(lastBlockHeight) {
      if (!this.assetContentTypes) { return; }

      let size = this.maxAssetHistories || DEFAULT_MAX_ASSET_HISTORIES;
      let { data: assets } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
        filter: {
          type: { exact: this.assetContentTypes }
        },
        page: { size }
      });
      let assetIds = assets.map(i => i.id);
      let transactions = [];
      for (let address of assetIds) {
        let query = {
          filter: {
            or: [{
              type: { exact: 'ethereum-transactions' },
              'transaction-to': address.toLowerCase(),
            }, {
              type: { exact: 'ethereum-transactions' },
              'transaction-from': address.toLowerCase(),
            }]
          }
        };
        if (lastBlockHeight != null) {
          query.filter.or.forEach(clause => {
            clause['block-number'] = { range: { gt: lastBlockHeight } };
          });
        }
        let { data:transactionsForAddress } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, query);
        transactions = transactions.concat(transactionsForAddress);
      }

      return { assets, transactions };
    }

    async _buildAssetHistory({ today, asset, transactions }) {
      let newHistoryValues = await this._buildNewHistoryValues(today, asset, transactions);

      let batch = this.pgsearchClient.beginBatch(this.schema, this.searchers);
      for (let historyValue of newHistoryValues) {
        await this._indexResource(batch, historyValue);
      }

      let assetHistory;
      try {
        assetHistory = (await this.searchers.get(Session.INTERNAL_PRIVILEGED, 'local-hub', 'asset-histories', asset.id.toLowerCase())).data;
      } catch (err) {
        if (err.status !== 404) { throw err; }
        assetHistory = {
          type: 'asset-histories',
          id: asset.id.toLowerCase(),
          relationships: {
            asset: { data: { type: asset.type, id: asset.id } },
            'history-values': { data: [] }
          }
        };
      }
      let historyValues = get(assetHistory, 'relationships.history-values.data') || [];
      historyValues = uniqBy(historyValues.concat(newHistoryValues.map(({type, id}) => { return { type, id }; })), 'id');
      assetHistory.relationships = assetHistory.relationships || {};
      assetHistory.relationships['history-values'] = { data: historyValues };

      await this._indexResource(batch, assetHistory);
      await batch.done();
    }

    async _buildNewHistoryValues(today, asset, transactions=[]) {
      let successfulTransactions = transactions.filter(txn => get(txn, 'attributes.transaction-successful'));
      let { data: [lastIndexedHistoryValue] } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
        filter: {
          type: { exact: 'asset-history-values' },
          'asset.id': { exact: asset.id.toLowerCase() }
        },
        page: { size: 1 },
        sort: '-timestamp-ms'
      });

      if (!successfulTransactions || !successfulTransactions.length) {
        // in this case we need to return history values for each day between the last indexed history value and today that
        // all have the same balance as the last indexed history value
        if (!lastIndexedHistoryValue) { return []; }

        let lastIndexedDate = moment(get(lastIndexedHistoryValue, 'attributes.timestamp-ms'), 'x').utc().startOf('day');
        let daysOfHistory = moment(today, 'YYYY-MM-DD').utc().diff(lastIndexedDate, 'days');
        let balance = get(lastIndexedHistoryValue, 'attributes.balance');

        let newHistoryValues = [];
        for (let i = 1; i <= daysOfHistory; i++) {
          let timestamp = moment(lastIndexedDate, 'YYYY-MM-DD').utc().startOf('day').add(i, 'day').valueOf();
          newHistoryValues.push(buildHistoryValue({ asset, timestamp, balance }));
        }
        return newHistoryValues;
      }

      let historyValues = [];
      let historyStartDate = moment(successfulTransactions[0].attributes.timestamp, 'X').utc().startOf('day');
      let daysOfHistory = moment(today, 'YYYY-MM-DD').utc().diff(historyStartDate, 'days');

      for (let i = lastIndexedHistoryValue ? 1 : 0; i <= daysOfHistory; i++) {
        let timestamp = moment(historyStartDate, 'YYYY-MM-DD').utc().startOf('day').add(i, 'day').valueOf();
        historyValues.push(buildHistoryValue({ asset, timestamp }));
      }
      for (let transaction of successfulTransactions) {
        historyValues.push(buildHistoryValue({ asset, transaction }));
      }
      historyValues = sortBy(historyValues, [ 'attributes.timestamp', 'id']);

      log.trace(`deriving balance from history: ${JSON.stringify(historyValues, null, 2)}`);
      let balance = new BN(0);
      for (let historyValue of historyValues) {
        let transaction;
        let transactionId = get(historyValue, 'relationships.transaction.data.id');
        let transactionType = get(historyValue, 'relationships.transaction.data.type');
        if (transactionId && transactionType && (transaction = successfulTransactions.find(i => i.id === transactionId && i.type === transactionType))) {
          balance = updateBalanceFromTransaction(balance, asset.id, transaction, log);
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
      let schema = await this.schema.getSchema();
      let contentType = schema.types.get(type);
      let sourceId = contentType.dataSource.id;
      return this.searchers.createDocumentContext({
        id,
        type,
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

function buildHistoryValue({ asset, transaction, timestamp, balance }) {
  let transactionUnixTime = get(transaction, 'attributes.timestamp');
  timestamp = transactionUnixTime ? transactionUnixTime * 1000 : timestamp;
  let transactionRelationship = transaction ? { type: transaction.type, id: transaction.id } : null;
  let historyValue = {
    id: `${asset.id}_${timestamp}${transaction ? '_' + transaction.id : ''}`,
    type: 'asset-history-values',
    attributes: { 'timestamp-ms': timestamp },
    relationships: {
      asset: { data: { type: asset.type, id: asset.id } },
      transaction: { data: transactionRelationship }
    }
  };
  if (balance != null) {
    historyValue.attributes.balance = balance;
  }
  return historyValue;
}
