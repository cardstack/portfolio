const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { hashPasswordSync } = require('portfolio-crypto');

let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  let user = factory.addResource('portfolio-users', 'test-user')
    .withAttributes({
      'name': 'Carl Stack',
      'email-address': 'user@cardstack.com',
      'password-hash': hashPasswordSync('password'),
      'avatarUrl': '/portfolio-common/images/avatar.png'
    });

  // TODO: add networks to contents/ folder

  let bitcoinNetwork = factory.addResource('networks', 'bitcoin')
    .withAttributes({
      title: 'Bitcoin',
      unit: 'BTC',
    });
  let ethereumNetwork = factory.addResource('networks', 'ether')
    .withAttributes({
      title: 'Ether',
      unit: 'ETH',
      'asset-type': 'ethereum-addresses',
      'address-field': 'ethereum-address'
    });
  let litecoinNetwork = factory.addResource('networks', 'litecoin')
    .withAttributes({
      title: 'Litecoin',
      unit: 'LTC',
    });
  let zcashNetwork = factory.addResource('networks', 'zcash')
    .withAttributes({
      title: 'Zcash',
      unit: 'ZEC',
    });

  let bitcoinAsset = factory.addResource('assets', '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX')
    .withRelated('network', bitcoinNetwork);

  let simpleEthereumAsset = factory.addResource('assets', '0x09FBEDDc5f94fA2713CDa75A68457cA8A4527adf')
    .withRelated('network', ethereumNetwork);

  let mockedEthereumAsset = factory.addResource('assets', '0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE')
    .withRelated('network', ethereumNetwork);

  let litecoinAsset = factory.addResource('assets', 'LXA3i9eEAVDbgDqkThCa4D6BUJ3SEULkEr')
    .withRelated('network', litecoinNetwork);

  let zcashAsset = factory.addResource('assets', 't1VpYecBW4UudbGcy4ufh61eWxQCoFaUrPs')
    .withRelated('network', zcashNetwork);

  let anotherBitcoinAsset = factory.addResource('assets', '1FCciasLYWGNApYcS6Lm79y7HY8uJ37hYf')
    .withRelated('network', bitcoinNetwork);

  let anotherLitecoinAsset = factory.addResource('assets', '36qBQrnsCQmiVU6aZaCkZLKr3kzwDbE8co')
    .withRelated('network', litecoinNetwork);

  factory.addResource('portfolios', 'test-portfolio').withAttributes({
    title: 'My Portfolio'
  })
    .withRelated('user', user)
    .withRelated('wallets', [
      factory.addResource('wallets', 'demo-wallet')
        .withAttributes({
          title: 'Demo Wallet'
        })
        .withRelated('user', user)
        .withRelated('assets', [
          mockedEthereumAsset,
          simpleEthereumAsset,
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
          anotherBitcoinAsset,
          mockedEthereumAsset,
          simpleEthereumAsset,
          anotherLitecoinAsset
        ])
  ]);
}

module.exports = factory.getModels();
