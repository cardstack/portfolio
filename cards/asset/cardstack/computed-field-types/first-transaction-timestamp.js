exports.type = '@cardstack/core-types::integer';

exports.compute = async function(model) {
  let network = await model.getRelated('network');
  let asset = await model.getRelated('network-asset');

  if (!asset) { return; }

  let contentType = await network.getField('asset-type');
  if (!contentType) { return; }

  if (['ethereum-addresses', 'mock-addresses'].includes(contentType)) {
    let transactions = await asset.getRelated('transactions');
    if (!transactions || !transactions.length) { return; }

    return await transactions[0].getField('timestamp');
  }

};