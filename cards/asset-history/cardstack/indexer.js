const { isEqual, get } = require('lodash');
const { declareInjections } = require('@cardstack/di');
const log = require('@cardstack/logger')('portfolio/asset-history/indexer');

module.exports = declareInjections({
  searchers: 'hub:searchers',
  historyIndexer: `plugin-services:${require.resolve('./history-indexer')}`
}, class AssetHistoryIndexer {

    async beginUpdate() {
      await this.historyIndexer.start({
        assetContentTypes: this.assetContentTypes,
        transactionContentTypes: this.transactionContentTypes,
        maxAssetHistories: this.maxAssetHistories,
        mockNow: this.mockNow
      });

      return new Updater(this.searchers, this.dataSource.id, this.historyIndexer);
    }
  });

class Updater {
  constructor(searchers, dataSourceId, historyIndexer) {
    this.searchers = searchers;
    this.dataSourceId = dataSourceId;
    this.historyIndexer = historyIndexer;
  }

  async schema() {
    return [{
      type: 'fields',
      id: 'asset',
      attributes: {
        'field-type': '@cardstack/core-types::belongs-to'
      },
    }, {
      type: 'fields',
      id: 'transaction',
      attributes: {
        'field-type': '@cardstack/core-types::belongs-to'
      },
    }, {
      type: 'fields',
      id: 'history-values',
      attributes: {
        'field-type': '@cardstack/core-types::has-many'
      },
      relationships: {
        'related-types': {
          data: [{ type: 'content-types', id: 'asset-history-values' }]
        }
      }
    }, {
      type: 'fields',
      id: 'balance',
      attributes: {
        'field-type': '@cardstack/core-types::string'
      },
    }, {
      type: 'fields',
      id: 'timestamp-ms',
      attributes: {
        'field-type': '@cardstack/core-types::integer'
      },
    }, {
      type: 'computed-fields',
      id: 'historic-rates',
      attributes: {
        'computed-field-type': 'portfolio-crypto-compare::rates-from-timestamp',
        params: {
          timestampField: 'timestamp-unix'
        }
      },
    }, {
      type: 'computed-fields',
      id: 'timestamp-unix',
      attributes: {
        'computed-field-type': 'portfolio-asset-history::timestamp-ms-to-unix',
        params: {
          dateField: 'timestamp-ms'
        }
      },
    }, {
      type: 'computed-fields',
      id: 'timeseries',
      attributes: {
        'computed-field-type': 'portfolio-asset-history::timeseries-from-history-values',
        params: {
          historyValuesField: 'history-values',
          fromCurrency: 'ETH',
          toCurrencies: ['USD', 'EUR', 'BTC']
        }
      },
    }, {
      type: 'content-types',
      id: 'asset-histories',
      attributes: {
        'default-includes': ['history-values', 'history-values.historic-rates', 'history-values.transactions'],
      },
      relationships: {
        fields: {
          data: [
            { type: 'fields', id: 'asset' },
            { type: 'fields', id: 'history-values' },
            { type: 'computed-fields', id: 'timeseries' },
          ]
        },
        'data-source': {
          data: { type: 'data-sources', id: this.dataSourceId.toString() }
        }
      }
    }, {
      type: 'content-types',
      id: 'asset-history-values',
      attributes: {
        'default-includes': ['historic-rates', 'transactions'],
      },
      relationships: {
        fields: {
          data: [
            { type: 'fields', id: 'timestamp-ms' },
            { type: 'fields', id: 'transaction' },
            { type: 'fields', id: 'asset' },
            { type: 'fields', id: 'balance' },
            { type: 'computed-fields', id: 'timestamp-unix' },
            { type: 'computed-fields', id: 'historic-rates' },
          ]
        },
        'data-source': {
          data: { type: 'data-sources', id: this.dataSourceId.toString() }
        }
      }
    }];
  }

  async updateContent(meta, hints, ops) {
    log.debug(`starting asset history indexing`);
    let schema = await this.schema();
    let isSchemaUnchanged;
    let lastBlockHeight = get(meta, 'lastBlockHeight');

    if (meta) {
      let { lastSchema } = meta;
      isSchemaUnchanged = isEqual(lastSchema, schema);
    }

    if (!isSchemaUnchanged) {
      await ops.beginReplaceAll();
      for (let model of schema) {
        await ops.save(model.type, model.id, { data: model });
      }
      await ops.finishReplaceAll();
    }

    let opts = Object.assign({ lastBlockHeight }, hints);
    let blockHeight = await this.historyIndexer.index(opts);

    log.debug(`ending asset history indexing`);
    return {
      lastBlockHeight: blockHeight,
      lastSchema: schema
    };
  }
}