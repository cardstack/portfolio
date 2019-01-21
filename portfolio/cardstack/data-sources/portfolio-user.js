const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

factory.addResource('data-sources', 'portfolio-user')
  .withAttributes({
    sourceType: 'portfolio-user',
  });

module.exports = factory.getModels();