exports.type = '@cardstack/core-types::string';

exports.compute = async function(model, { networkId }) {
  if (!networkId) { return; }

  let network = await model.getRelated('network');
  if (!network) { return; }

  if (await network.getField('id') === networkId) {
    return await model.getField('id');
  }
};