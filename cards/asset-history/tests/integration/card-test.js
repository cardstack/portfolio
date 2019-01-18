import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('asset-historys', '123')
      .withAttributes({
        title: 'Hello'
      })
  }
});

module('Card | asset-history', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test asset-history' '123' format="embedded"}}`);
    assert.dom('[data-test-asset-history-embedded-title]').hasText('Hello');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test asset-history' '123' format="isolated"}}`);
    assert.dom('[data-test-asset-history-isolated-title]').hasText('Hello');
  });
});
