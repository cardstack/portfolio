exports.type = '@cardstack/core-types::string';

exports.compute = async function(model) {
  let network = await model.getRelated('network');
  let asset = await model.getRelated('network-asset');

  if (!network || !asset) { return; }

  let tokenSymbol = (await network.getField('unit')).toLowerCase();

  let contentType = await network.getField('asset-type');
  if (!contentType) { return; }

  if (['ethereum-addresses', 'mock-addresses'].includes(contentType)) {
    return (await asset.getField('balance'));
  }

  if (contentType === `${tokenSymbol}-token-balance-ofs`) {
    return (await asset.getField('mapping-number-value'));
  }
};