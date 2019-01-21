const moment = require('moment-timezone');
exports.type = '@cardstack/core-types::integer';

exports.compute = async function(model, { dateField }) {
  if (!dateField) { return; }
  let gmtDate = await model.getField(dateField);
  if (!gmtDate) { return; }

  return moment(gmtDate, 'YYYY-MM-DD').utc().valueOf();
};