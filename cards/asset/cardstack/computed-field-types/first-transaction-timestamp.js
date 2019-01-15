exports.type = '@cardstack/core-types::integer';

exports.compute = async function(model) {
  let asset = await model.getRelated('network-asset');
  if (!asset) { return; }
  let transactions = await asset.getRelated('transactions');
  if (!transactions || !transactions.length) { return; }

  return await transactions[0].getField('timestamp');
};