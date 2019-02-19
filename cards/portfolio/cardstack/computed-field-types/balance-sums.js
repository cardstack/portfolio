exports.type = '@cardstack/core-types::object';

const toCurrencies = ['USD', 'EUR', 'BTC'];

exports.compute = async function(model) {
  let wallets = await model.getRelated('wallets');
  let results = {};

  if (!wallets || !wallets.length) {
    for (let currency of toCurrencies) {
      results[currency] = 0;
    }
    return results;
  }

  for (let wallet of wallets) {
    if (!wallet) { continue; }

    let balances = await wallet.getField('total-assets-balance');
    for (let currency of Object.keys(balances)) {
      results[currency] = (results[currency] || 0) + balances[currency];
    }
  }

  return results;
};