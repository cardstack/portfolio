const { convertCurrency } = require('portfolio-utils');

exports.type = '@cardstack/core-types::object';

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
    if (!historyValue) { continue; }
    let timestamp = await historyValue.getField('timestamp-ms');
    let rates = await historyValue.getRelated('historic-rates');
    let balance = await historyValue.getField('balance');

    // Think about how to expand this to calculate timeseries for currencies other than ethers
    for (let toCurrency of toCurrencies) {
      result[toCurrency].push([timestamp, await convertCurrency('ETH', toCurrency, balance, rates)]);
    }
  }

  return result;
};