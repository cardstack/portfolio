exports.type = '@cardstack/core-types::boolean';

exports.compute = async function(model) {
  let asset = await model.getRelated('network-asset');
  if (!asset) { return true; }

  let meta = asset.getMeta();

  return Boolean(meta && meta.loadingTransactions);
};