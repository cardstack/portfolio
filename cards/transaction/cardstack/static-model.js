const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();

factory.addResource('computed-fields', 'rates-at-transaction-timestamp').withAttributes({
  'computed-field-type': 'portfolio-crypto-compare::rates-from-timestamp',
  params: { timestampField: 'timestamp' }
});

let models = factory.getModels();
module.exports = function() { return models; };
