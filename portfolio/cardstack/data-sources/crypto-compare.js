const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

factory.addResource('data-sources', 'crypto-compare')
  .withAttributes({
    sourceType: 'portfolio-crypto-compare',
    params: {
      'cryptoCompareDailyAverageApiUrl': 'https://min-api.cryptocompare.com/data/dayAvg', // TODO move env var
      'apiKey': process.env.CRYPTO_COMPARE_API_KEY,
      'toFiatCurrencies': ['USD', 'EUR'],
      'fromCryptoCurrencies': ['BTC', 'ETH'/*, 'LTC', 'ZEC'*/]
    }
  });

module.exports = factory.getModels();