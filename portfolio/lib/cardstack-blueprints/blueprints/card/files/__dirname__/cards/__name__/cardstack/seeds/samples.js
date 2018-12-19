const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('<%= dasherizedModuleName %>s')
    .withAttributes({
      title: 'Generated'
    });
}

module.exports = factory.getModels();
