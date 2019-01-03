const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('portfolios', '1')
    .withAttributes({
      title: 'My Portfolio'
    })
    .withRelated('wallets', [
      { type: 'wallets', id: 'ing-wallet' },
      { type: 'wallets', id: 'trezor-wallet' },
    ]);
}

module.exports = factory.getModels();
