const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('transactions', '31')
    .withAttributes({
      title: 'Transaction 31'
    });

  factory.addResource('transactions', '32')
    .withAttributes({
      title: 'Transaction 32'
    });
}

module.exports = factory.getModels();
