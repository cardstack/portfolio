const moment = require('moment-timezone');

exports.type = '@cardstack/core-types::has-many';

const conversions = {
  BTC: ['USD', 'EUR'],
  ETH: ['USD', 'EUR'],
  LTC: ['USD', 'EUR'],
  ZEC: ['USD', 'EUR'],
};

exports.compute = async function(model, { timestampField }) {
  if (!timestampField) { return; }

  let timestamp = await model.getField(timestampField);
  if (!timestamp) { return; }

  let date = moment(timestamp, 'X').utc().format('YYYY-MM-DD');
  let results = [];
  for (let fromCurrency of Object.keys(conversions)) {
    for (let toCurrency of conversions[fromCurrency]) {
      results.push({ type: 'crypto-compares', id: `${fromCurrency}_${toCurrency}_${date}` });
    }
  }
  return results;
};
