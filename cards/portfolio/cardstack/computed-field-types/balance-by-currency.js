
const { utils: { BN } } = require('web3');
const { convertCurrency } = require('portfolio-utils');

exports.type = '@cardstack/core-types::object';

const toCurrencies = ['USD', 'EUR', 'BTC'];

exports.compute = async function (model) {
  let results = {};
  let wallets = await model.getRelated('wallets');
  let todaysRates = await model.getRelated('todays-rates-lookup');
  let rates = todaysRates ? await todaysRates.getRelated('rates') : null;
  if (!wallets || !wallets.length || !rates || !rates.length) {
    return results;
  }

  let fromBalances = {};
  for (let wallet of wallets) {
    if (!wallet) { continue; }

    let assets = await wallet.getRelated('assets');
    if (!assets || !assets.length) { continue; }

    for (let asset of assets) {
      let fromCurrency = await asset.getField('network-unit');
      let balanceStr = await asset.getField('network-balance');
      let balance = balanceStr ? new BN(balanceStr) : new BN(0);
      fromBalances[fromCurrency] = (fromBalances[fromCurrency] || new BN(0)).add(balance);
    }
  }

  for (let fromCurrency of Object.keys(fromBalances)) {
    results[fromCurrency] = {};
    for (let toCurrency of toCurrencies) {
      results[fromCurrency][toCurrency] = (results[fromCurrency][toCurrency] || 0) + await convertCurrency(fromCurrency, toCurrency, fromBalances[fromCurrency], rates);
    }
  }

  return results;
};
