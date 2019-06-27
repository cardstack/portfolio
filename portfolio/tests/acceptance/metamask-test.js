import { module, test } from 'qunit';
import { visit, currentURL, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import MockWeb3Service from '../helpers/mock-web3-service';
import MockErc20Service from '../helpers/mock-erc20-service';
import { run } from '@ember/runloop';

const metamaskWalletAddress = '0x56789';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('data-sources', 'portfolio-user')
      .withAttributes({
        sourceType: 'portfolio-user',
      });

    let user = factory.addResource('portfolio-users', 'test-user').withAttributes({
      name: 'Hassan Abdel-Rahman',
      'email-address': 'hassan@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    });

    let ethereumAsset = factory.addResource('assets', '0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE')
    .withRelated('network', factory.addResource('networks', 'ether')
      .withAttributes({
        title: 'Ether',
        unit: 'ETH',
        'asset-type': 'ethereum-addresses',
        'address-field': 'ethereum-address'
      }));
    let bitcoinAsset = factory.addResource('assets', '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX')
    .withRelated('network', factory.addResource('networks', 'bitcoin')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC',
      }));

    factory.addResource('networks', 'card')
      .withAttributes({
        title: 'Cardstack Token',
        unit: 'CARD',
        'asset-type': 'card-token-balance-ofs'
      });

    factory.addResource('ethereum-addresses', metamaskWalletAddress)
      .withAttributes({
        "balance": "340577000000000000",
        "ethereum-address": metamaskWalletAddress
      })

    factory.addResource('portfolios', 'test-portfolio').withAttributes({
      title: 'My Cardfolio'
    })
      .withRelated('wallets', [
        factory.addResource('wallets', 'test-wallet').withAttributes({
          title: 'Test Wallet'
        })
          .withRelated('user', user)
          .withRelated('assets', [
            bitcoinAsset,
            ethereumAsset,
          ])
      ])
      .withRelated('user', user);

    factory.addResource('card-token-balance-ofs', metamaskWalletAddress).withAttributes({
      "ethereum-address": metamaskWalletAddress,
      "mapping-number-value": "53824000000000000000"
    });


    factory.addResource('ethereum-addresses', '0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde')
      .withAttributes({
        "balance": "200895000000000000",
        "ethereum-address": "0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE"
      })
      .withRelated('transactions', [
        factory.addResource('ethereum-transactions', '0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572')
          .withAttributes({
            "transaction-successful": true,
            "transaction-index": 0,
            "cumulative-gas-used": 21000,
            "transaction-data": "0x0",
            "timestamp": 1547478615,
            "transaction-nonce": 0,
            "block-number": 6,
            "gas-used": 21000,
            "transaction-from": "0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5",
            "block-hash": "0x62c48a107a96894248726dba13d114a1760fa9eef5370e98a0651ccb0ba0c41f",
            "transaction-to": "0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde",
            "gas-price": "5000000000",
            "transaction-hash": "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572",
            "gas": 90000,
            "transaction-value": "101000000000000000"
          }),
        factory.addResource('ethereum-transactions', '0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2')
          .withAttributes({
            "transaction-successful": true,
            "transaction-index": 0,
            "cumulative-gas-used": 21000,
            "transaction-data": "0x0",
            "timestamp": 1547478616,
            "transaction-nonce": 0,
            "block-number": 8,
            "gas-used": 21000,
            "transaction-from": "0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde",
            "block-hash": "0x4abacac4089661d1ba407ff4286f768bdaa58a95a7db5770b15a6f6bb1843af6",
            "transaction-to": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
            "gas-price": "5000000000",
            "transaction-hash": "0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2",
            "gas": 90000,
            "transaction-value": "100000000000000000"
          }),
      ]);

      factory.addResource('grants')
        .withRelated('who', [{ type: 'groups', id: 'everyone' }])
        .withRelated('types', [
          { type: 'content-types', id: 'assets' },
          { type: 'content-types', id: 'asset-histories' },
          { type: 'content-types', id: 'networks' },
          { type: 'content-types', id: 'ethereum-addresses' },
          { type: 'content-types', id: 'ethereum-transactions' }
        ])
        .withAttributes({
          'may-read-resource': true,
          'may-read-fields': true,
        });
  },
});

module('Acceptance | Metamask - without extension installed', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('user sees default portfolio if they do not have metamask extension installed', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await waitFor('[data-test-network-section]');

    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('overview');
    assert.dom('[data-test-grid-display-item="0"] [data-test-asset-embedded-title]').hasText('Ether');
    assert.dom('[data-test-grid-display-item="0"] [data-test-asset-embedded-balance]').hasTextContaining('0.2009 ETH');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-title]').hasText('Bitcoin');
  });
});

module('Acceptance | Metamask - with extension installed', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:web3', MockWeb3Service);
    this.owner.register('service:erc20', MockErc20Service);
    this.owner.inject('component:portfolio-isolated', 'web3', 'service:web3');
    this.owner.inject('component:portfolio-isolated', 'erc20', 'service:erc20');

    let web3 = this.owner.lookup('service:web3');
    run(() => web3.set('address', metamaskWalletAddress));

    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('user sees metamask wallet information if they have metamask extension installed', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await waitFor('[data-test-network-section]');

    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('overview');
    assert.dom('[data-test-grid-display-item="0"] [data-test-asset-embedded-title]').hasText('Cardstack Token');
    assert.dom('[data-test-grid-display-item="0"] [data-test-asset-embedded-fiat-value]').hasText('≈ $5382.40 USD');
    assert.dom('[data-test-grid-display-item="0"] [data-test-asset-embedded-balance]').hasTextContaining('53.8240 CARD');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-title]').hasText('Ether');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-fiat-value]').hasText('≈ $34.06 USD');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-balance]').hasTextContaining('0.3406 ETH');
  });
});