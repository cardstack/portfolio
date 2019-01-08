const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  // factory.addResource('portfolio-users')
  //   .withAttributes({
  //   });
}

module.exports = factory.getModels();
