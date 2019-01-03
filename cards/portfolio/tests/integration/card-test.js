import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    let wallet1 = factory.addResource('wallets')
      .withAttributes({
        title: 'Wallet 1'
      });

    let wallet2 = factory.addResource('wallets')
      .withAttributes({
        title: 'Wallet 2'
      });

    factory.addResource('portfolios', '123')
      .withAttributes({
        title: 'My Portfolio Test'
      })
      .withRelated('wallets', [ wallet1, wallet2 ]);
  }
});

module('Card | portfolio', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await renderCard('portfolio', '123', 'embedded');
    assert.dom('[data-test-portfolio-embedded-title]').hasText('My Portfolio Test');
  });

  test('isolated format renders', async function(assert) {
    await renderCard('portfolio', '123', 'isolated');
    assert.dom('[data-test-portfolio-isolated-title]').hasText('My Portfolio Test');
    assert.dom('[data-test-portfolio-isolated-wallet="0"] [data-test-wallet-embedded-title]').hasText('Wallet 1');
    assert.dom('[data-test-portfolio-isolated-wallet="1"] [data-test-wallet-embedded-title]').hasText('Wallet 2');
  });
});
