exports.type = '@cardstack/core-types::case-insensitive';

exports.compute = async function(model, { field }) {
  if (!field) { return; }
  return await model.getField(field);
};
