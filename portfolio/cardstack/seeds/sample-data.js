const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { hashPasswordSync } = require('portfolio-crypto');
const { erc20Tokens } = require('portfolio-utils');

let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  let user = factory.addResource('portfolio-users', 'test-user')
    .withAttributes({
      'name': 'Carl Stack',
      'email-address': 'user@cardstack.com',
      'password-hash': hashPasswordSync('password'),
      'avatarUrl': '/portfolio-common/images/avatar.png'
    });

  let bitcoinNetwork = factory.addResource('networks', 'bitcoin')
    .withAttributes({
      title: 'Bitcoin',
      unit: 'BTC',
      'asset-type': 'mock-addresses',
      'address-field': 'mock-address',
    });
  let ethereumNetwork = factory.addResource('networks', 'ether')
    .withAttributes({
      title: 'Ether',
      unit: 'ETH',
      'asset-type': 'ethereum-addresses',
      'address-field': 'ethereum-address',
    });
  let litecoinNetwork = factory.addResource('networks', 'litecoin')
    .withAttributes({
      title: 'Litecoin',
      unit: 'LTC',
      'asset-type': 'mock-addresses',
      'address-field': 'mock-address',
    });
  let zcashNetwork = factory.addResource('networks', 'zcash')
    .withAttributes({
      title: 'Zcash',
      unit: 'ZEC',
      'asset-type': 'mock-addresses',
      'address-field': 'mock-address',
    });

  let tokenNetworks = {};

  for (let token of erc20Tokens) {
    let tokenSymbol = token.symbol;

    let network = factory.addResource('networks', tokenSymbol.toLowerCase())
      .withAttributes({
        title: token.name,
        unit: tokenSymbol,
        'asset-type': `${tokenSymbol.toLowerCase()}-token-balance-ofs`
      });

    tokenNetworks[tokenSymbol] = network;
  }

  let defaultWallets = [];

  if (!process.env.JSON_RPC_URLS) {
    let bitcoinAsset = factory.addResource('assets', '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX')
      .withRelated('network', bitcoinNetwork);

    // this is an address that has real etheruem history use it when you want to test live ethereum state
    factory.addResource('assets', '0x6294Ec6903021325978E58304d5E4604F0748685')
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

    let demoWalletAssets = [
      mockedEthereumAsset,
      litecoinAsset,
      zcashAsset,
      bitcoinAsset
    ];
    let trezorWalletAssets = [
      anotherBitcoinAsset,
      anotherLitecoinAsset
    ];

    defaultWallets = [
      factory.addResource('wallets', 'demo-wallet')
        .withAttributes({
          title: 'Demo Wallet'
        })
        .withRelated('user', user)
        .withRelated('assets', demoWalletAssets),
      factory.addResource('wallets', 'trezor-wallet')
        .withAttributes({
          title: 'Trezor Wallet Model T',
          logo: 'trezor-logo'
        })
        .withRelated('user', user)
        .withRelated('assets', trezorWalletAssets)
    ];
  }

  factory.addResource('portfolios', 'test-portfolio').withAttributes({
    title: 'My Cardfolio'
  })
    .withRelated('user', user)
    .withRelated('wallets', defaultWallets);
}

module.exports = factory.getModels();
