/* eslint-env node */

module.exports = [
  {
    type: 'plugin-configs',
    id: '@cardstack/hub',
    relationships: {
      'default-data-source': {
        data: { type: 'data-sources', id: 0 }
      }
    }
  },
  {
    type: 'data-sources',
    id: 0,
    attributes: {
      'source-type': '@cardstack/ephemeral',
    }
  },
  {
    type: 'data-sources',
    id: 'crypto-compare',
    attributes: {
      'source-type': 'portfolio-crypto-compare',
      params: {
        'cryptoCompareDailyAverageApiUrl': 'http://nowhere',
        'toFiatCurrencies': ['USD', 'EUR'],
        'fromCryptoCurrencies': ['BTC', 'ETH', 'LTC', 'ZEC']
      }
    }
  },{
    type: 'grants',
    id: 'wide-open',
    attributes: {
      'may-create-resource': true,
      'may-read-resource': true,
      'may-update-resource': true,
      'may-delete-resource': true,
      'may-write-fields': true,
      'may-read-fields': true
    },
    relationships: {
      who: {
        data: [{
          type: 'groups',
          id: 'everyone'
        }]
      }
    }
  }
];
