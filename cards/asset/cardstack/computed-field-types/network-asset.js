exports.type = '@cardstack/core-types::belongs-to';

exports.compute = async function(model) {
  let network = await model.getRelated('network');
  if (!network) { return; }

  let type = await network.getField('asset-type');
  if (!type) { return; }

  let id = (await model.getField('id')).toLowerCase();

  return { type, id };
};