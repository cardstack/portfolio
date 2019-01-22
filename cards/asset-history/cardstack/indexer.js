
const { declareInjections } = require('@cardstack/di');
const log = require('@cardstack/logger')('portfolio/asset-history/indexer');

module.exports = declareInjections({
  searchers: 'hub:searchers',
  controllingBranch: 'hub:controlling-branch',
  historyIndexer: `plugin-services:${require.resolve('./history-indexer')}`
}, class AssetHistoryIndexer {

    async branches() {
      return [this.controllingBranch.name];
    }

    async beginUpdate() {
      await this.historyIndexer.start({
        assetContentTypes: this.assetContentTypes,
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
      type: 'computed-fields',
      id: 'historic-rates',
      attributes: {
        'computed-field-type': 'portfolio-crypto-compare::rates-from-date',
        params: {
          dateField: 'gmt-date'
        }
      },
    }, {
      type: 'computed-fields',
      id: 'timestamp-ms',
      attributes: {
        'computed-field-type': 'portfolio-asset-history::date-to-ms',
        params: {
          dateField: 'gmt-date'
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
            { type: 'fields', id: 'gmt-date' },
            { type: 'fields', id: 'transactions' },
            { type: 'fields', id: 'asset' },
            { type: 'fields', id: 'balance' },
            { type: 'computed-fields', id: 'timestamp-ms' },
            { type: 'computed-fields', id: 'historic-rates' },
          ]
        },
        'data-source': {
          data: { type: 'data-sources', id: this.dataSourceId.toString() }
        }
      }
    }];
  }

  async updateContent(meta, hints,/* ops*/) {
    log.debug(`starting asset history indexing`);

    await this.historyIndexer.index(hints);

    log.debug(`ending asset history indexing`);
  }
}