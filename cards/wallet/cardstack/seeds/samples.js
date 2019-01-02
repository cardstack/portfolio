const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('wallets', 'bitcoin-wallet')
    .withAttributes({
      title: 'ING Wallet'
    })
    .withRelated('assets', [{ type: 'assets', id: 'bitcoin' }]);
}

module.exports = factory.getModels();
