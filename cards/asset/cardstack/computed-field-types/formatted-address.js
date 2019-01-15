exports.type = '@cardstack/core-types::string';

exports.compute = async function(model) {
  let network = await model.getRelated('network');
  let asset = await model.getRelated('network-asset');
  let id = await model.getField('id');

  if (!network || !asset) { return id; }

  let addressField = await network.getField('address-field');
  if (!addressField) { return id; }

  return (await asset.getField(addressField)) || id;
};