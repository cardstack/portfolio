const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { hashPasswordSync } = require('portfolio-crypto');

let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  let user = factory.addResource('portfolio-users', 'test-user')
    .withAttributes({
      'name': 'Carl Stack',
      'email-address': 'user@cardstack.com',
      'password-hash': hashPasswordSync('password')
    });

  let bitcoinAsset = factory.addResource('assets', 'bitcoin')
    .withAttributes({
      title: 'Bitcoin',
      unit: 'BTC',
      logo: 'bitcoin',
    })
    .withRelated('transactions', [
      factory.addResource('transactions', '31')
        .withAttributes({
          title: 'Transaction 31'
        }),
      factory.addResource('transactions', '32')
        .withAttributes({
          title: 'Transaction 32'
        })
    ]);

  let ethereumAsset = factory.addResource('assets', 'ether')
    .withAttributes({
      title: 'Ether',
      unit: 'ETH',
      logo: 'ether',
    });

  let litecoinAsset = factory.addResource('assets', 'litecoin')
    .withAttributes({
      title: 'Litecoin',
      unit: 'LIT',
      logo: 'litecoin',
    });

  let zcashAsset = factory.addResource('assets', 'zcash')
    .withAttributes({
      title: 'Zcash',
      unit: 'ZEC',
      logo: 'zcash',
    });

  factory.addResource('portfolios', 'test-portfolio').withAttributes({
    title: 'My Portfolio'
  })
    .withRelated('user', user)
    .withRelated('wallets', [
      factory.addResource('wallets', 'ing-wallet')
        .withAttributes({
          title: 'ING Wallet',
          logo: 'ing-logo'
        })
        .withRelated('user', user)
        .withRelated('assets', [
          bitcoinAsset,
          ethereumAsset,
          litecoinAsset,
          zcashAsset,
          bitcoinAsset
        ]),
      factory.addResource('wallets', 'trezor-wallet')
        .withAttributes({
          title: 'Trezor Wallet Model T',
          logo: 'trezor-logo'
        })
        .withRelated('user', user)
        .withRelated('assets', [
          bitcoinAsset,
          ethereumAsset,
          litecoinAsset
        ])
  ]);
}

module.exports = factory.getModels();
