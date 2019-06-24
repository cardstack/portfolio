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

    factory.addResource('networks', 'ether')
      .withAttributes({
        title: 'Ether',
        unit: 'ETH',
        'asset-type': 'ethereum-addresses',
        'address-field': 'ethereum-address'
      })

    factory.addResource('ethereum-addresses', metamaskWalletAddress)
      .withAttributes({
        "balance": "200895000000000000",
        "ethereum-address": metamaskWalletAddress
      })

    factory.addResource('portfolios', 'test-portfolio').withAttributes({
      title: 'My Cardfolio'
    })
      .withRelated('user', user);

    factory.addResource('card-token-balance-ofs', metamaskWalletAddress).withAttributes({
      "ethereum-address": metamaskWalletAddress,
      "mapping-number-value": "53824000000000000000"
    });

    factory.addResource('networks', 'card')
      .withAttributes({
        title: 'Cardstack Token',
        unit: 'CARD',
        'asset-type': 'card-token-balance-ofs'
      });

  },
});

module('Acceptance | metamask', function(hooks) {
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
    assert.dom('[data-test-grid-display-item="0"] [data-test-asset-embedded-balance]').hasTextContaining('53.8240 CARD');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-title]').hasText('Ether');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-fiat-value]').hasText('≈ $20.09 USD');
    assert.dom('[data-test-grid-display-item="1"] [data-test-asset-embedded-balance]').hasTextContaining('0.2009 ETH');
  });
});