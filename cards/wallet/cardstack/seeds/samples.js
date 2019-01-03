const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  factory.addResource('wallets', 'ing-wallet')
    .withAttributes({
      title: 'ING Wallet',
      logo: 'ing-logo'
    })
    .withRelated('assets', [
      { type: 'assets', id: 'bitcoin' },
      { type: 'assets', id: 'ether' },
      { type: 'assets', id: 'litecoin' },
      { type: 'assets', id: 'zcash' },
      { type: 'assets', id: 'bitcoin' },
    ]);

  factory.addResource('wallets', 'trezor-wallet')
    .withAttributes({
      title: 'Trezor Wallet Model T',
      logo: 'trezor-logo'
    })
    .withRelated('assets', [
      { type: 'assets', id: 'bitcoin' },
      { type: 'assets', id: 'ether' },
      { type: 'assets', id: 'litecoin' },
    ]);
}

module.exports = factory.getModels();
