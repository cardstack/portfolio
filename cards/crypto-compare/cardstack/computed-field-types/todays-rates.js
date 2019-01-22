exports.type = '@cardstack/core-types::belongs-to';

exports.compute = async function() {
  return { type: 'crypto-compare-current-rates', id: 'today' };
};