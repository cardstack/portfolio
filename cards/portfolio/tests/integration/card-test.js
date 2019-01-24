import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

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

    factory.addResource('grants')
      .withRelated('who', [{ type: 'groups', id: 'everyone' }])
      .withRelated('types', [
        { type: 'content-types', id: 'portfolios' },
        { type: 'content-types', id: 'wallets' }
      ])
      .withAttributes({
        'may-read-resource': true,
        'may-read-fields': true,
      })
  }
});

module('Card | portfolio', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "portfolio" "123" format="embedded"}}`);
    assert.dom('[data-test-portfolio-embedded-title]').hasText('My Portfolio Test');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "portfolio" "123" format="isolated"}}`);
    assert.dom('[data-test-portfolio-isolated-title]').hasText('My Portfolio Test');
    assert.dom('[data-test-portfolio-isolated-wallet-count]').hasText('2');
    // TO DO: Total value calculation needed here!
    assert.dom('[data-test-portfolio-isolated-wallets-value]').hasText('≈ $ 0');
    assert.dom('[data-test-portfolio-isolated-wallet="0"] [data-test-wallet-embedded-title]').hasText('Wallet 1');
    assert.dom('[data-test-portfolio-isolated-wallet="1"] [data-test-wallet-embedded-title]').hasText('Wallet 2');
    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-portfolio-breadcrumbs]').doesNotExist();
  });
});
