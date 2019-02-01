const { utils: { BN } } = require('web3');
const { convertCurrency } = require('portfolio-utils');

exports.type = '@cardstack/core-types::object';

const toCurrencies = ['USD', 'EUR', 'BTC'];

exports.compute = async function(model) {
  let assets = await model.getRelated('assets');
  let todaysRates = await model.getRelated('todays-rates-lookup');
  let rates = todaysRates ? await todaysRates.getRelated('rates') : null;

  let results = {};
  if (!assets || !assets.length || !rates || !rates.length) {
    for (let currency of toCurrencies) {
      results[currency] = 0;
    }
    return results;
  }

  let fromBalances = {};
  for (let asset of assets) {
    let fromCurrency = await asset.getField('network-unit');
    let balanceStr = await asset.getField('network-balance');
    let balance = balanceStr ? new BN(balanceStr) : new BN(0);
    fromBalances[fromCurrency] = (fromBalances[fromCurrency] || new BN(0)).add(balance);
  }

  for (let fromCurrency of Object.keys(fromBalances)) {
    for (let toCurrency of toCurrencies) {
      results[toCurrency] = (results[toCurrency] || 0) + await convertCurrency(fromCurrency, toCurrency, fromBalances[fromCurrency], rates);
    }
  }

  return results;
};
