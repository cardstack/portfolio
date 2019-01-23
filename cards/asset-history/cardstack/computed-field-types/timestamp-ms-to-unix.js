exports.type = '@cardstack/core-types::integer';

exports.compute = async function(model, { dateField }) {
  if (!dateField) { return; }
  let timestampMs = await model.getField(dateField);
  if (!timestampMs) { return; }

  return Math.round(timestampMs / 1000);
};