const { utils: { fromWei } } = require('web3');
exports.type = '@cardstack/core-types::object';

const currencyCentsDecimalPlaces = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  JPY: 0,
  CNY: 0,
  BTC: 0,
};

exports.compute = async function(model, { historyValuesField, fromCurrency, toCurrencies }) {
  if (!historyValuesField) { return; }
  if (!fromCurrency) { return; }
  if (!toCurrencies || !toCurrencies.length) { return; }
  if (fromCurrency !== 'ETH') {
    throw new Error(`Currently the timeseries copmuted only support building a time series for ethers, the specified currency '${fromCurrency}' is not supported.`);
  }

  let result = {};
  for (let toCurrency of toCurrencies) {
    result[toCurrency] = [];
  }

  let historyValues = await model.getRelated(historyValuesField);
  if (!Array.isArray(historyValues)) { return []; }

  for (let historyValue of historyValues) {
    let timestamp = await historyValue.getField('timestamp-ms');
    let rates = await historyValue.getRelated('historic-rates');
    let balance = await historyValue.getField('balance');

    // Think about how to expand this to calculate timeseries for currencies other than ethers
    for (let toCurrency of toCurrencies) {
      let eth = parseFloat(fromWei(balance, 'ether'));
      let rateCents = await rateForEth(toCurrency, rates);
      let currencyDecimalPlaces = currencyCentsDecimalPlaces[toCurrency] || 2;
      let toRawCurrenyUnits = (rateCents * eth) / Math.pow(10, currencyDecimalPlaces);

      result[toCurrency].push([timestamp, toRawCurrenyUnits]);
    }
  }

  return result;
};

async function rateForEth(toCurrency, rates) {
  if (toCurrency === 'BTC') {
    let btcToUsdRate = await getRate('BTC', 'USD', rates);
    let ethToUsdRate = await getRate('ETH', 'USD', rates);
    if (!ethToUsdRate || !btcToUsdRate) { return; }

    let ethToUsdInCents = parseFloat(await ethToUsdRate.getField('cents'));
    let btcToUsdInCents = parseFloat(await btcToUsdRate.getField('cents'));

    return (ethToUsdInCents/btcToUsdInCents) * 100;
  } else {
    let ethToFiatRate = await getRate('ETH', toCurrency, rates);
    if (!ethToFiatRate) { return; }
    return await ethToFiatRate.getField('cents');
  }
}

async function getRate(fromCurrency, toCurrency, rates) {
  if (!fromCurrency || !toCurrency || !rates) { return; }

  return await find(rates, async r =>
    await r.getField('from-crypto-currency') === fromCurrency &&
    await r.getField('to-fiat-currency') === toCurrency);
}

async function find(list, predicate) {
  for (let element of list) {
    if (await predicate(element)) {
      return element;
    }
  }
}

