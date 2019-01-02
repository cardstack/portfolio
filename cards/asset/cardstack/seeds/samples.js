const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('assets', 'bitcoin')
    .withAttributes({
      title: 'Bitcoin',
      unit: 'BTC',
      logo: 'https://en.bitcoin.it/w/images/en/2/29/BC_Logo_.png',
    });
}

module.exports = factory.getModels();
