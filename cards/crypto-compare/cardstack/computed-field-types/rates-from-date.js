exports.type = '@cardstack/core-types::has-many';

const conversions = {
  BTC: ['USD', 'EUR'],
  ETH: ['USD', 'EUR'],
  // LTC: ['USD', 'EUR'],
  // ZEC: ['USD', 'EUR'],
};

exports.compute = async function(model, { dateField }) {
  if (!dateField) { return; }

  let date = await model.getField(dateField);
  if (!date) { return; }

  let results = [];
  for (let fromCurrency of Object.keys(conversions)) {
    for (let toCurrency of conversions[fromCurrency]) {
      results.push({ type: 'crypto-compares', id: `${fromCurrency}_${toCurrency}_${date}` });
    }
  }
  return results;
};