const { erc20Tokens } = require('portfolio-utils');
const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

let currencySymbols = ['BTC', 'ETH', 'LTC', 'ZEC'].concat(erc20Tokens.map(token => token.symbol));

factory.addResource('data-sources', 'crypto-compare')
  .withAttributes({
    sourceType: 'portfolio-crypto-compare',
    params: {
      'cryptoCompareDailyAverageApiUrl': 'https://min-api.cryptocompare.com/data/dayAvg', // TODO move env var
      'apiKey': process.env.CRYPTO_COMPARE_API_KEY,
      'toFiatCurrencies': ['USD', 'EUR'],
      'fromCryptoCurrencies': currencySymbols
    }
  });

module.exports = factory.getModels();
