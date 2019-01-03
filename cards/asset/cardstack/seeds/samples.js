const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('assets', 'bitcoin')
    .withAttributes({
      title: 'Bitcoin',
      unit: 'BTC',
      logo: 'bitcoin',
    });
  factory.addResource('assets', 'ether')
    .withAttributes({
      title: 'Ether',
      unit: 'ETH',
      logo: 'ether',
    });
  factory.addResource('assets', 'litecoin')
    .withAttributes({
      title: 'Litecoin',
      unit: 'LIT',
      logo: 'litecoin',
    });
  factory.addResource('assets', 'zcash')
    .withAttributes({
      title: 'Zcash',
      unit: 'ZEC',
      logo: 'zcash',
    });
}

module.exports = factory.getModels();
