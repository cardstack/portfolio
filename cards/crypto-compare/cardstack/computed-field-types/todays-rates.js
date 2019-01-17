const moment = require('moment-timezone');

exports.type = '@cardstack/core-types::has-many';

const conversions = {
  BTC: ['USD', 'EUR'],
  ETH: ['USD', 'EUR'],
  LTC: ['USD', 'EUR'],
  ZEC: ['USD', 'EUR'],
};

exports.compute = async function() {
  let today = moment().utc().format('YYYY-MM-DD');
  let results = [];
  for (let fromCurrency of Object.keys(conversions)) {
    for (let toCurrency of conversions[fromCurrency]) {
      results.push({ type: 'crypto-compares', id: `${fromCurrency}_${toCurrency}_${today}` });
    }
  }
  return results;
};