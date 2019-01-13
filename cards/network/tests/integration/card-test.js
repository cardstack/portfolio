import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('networks', '123')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC'
      })
  }
});

module('Card | network', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test 'network' '123' format="embedded"}}`);
    assert.dom('[data-test-network-embedded-unit]').hasText('BTC');
    assert.dom('[data-test-network-embedded-title]').hasText('Bitcoin');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test 'network' '123' format="isolated"}}`);
    assert.dom('[data-test-network-isolated-unit]').hasText('BTC');
    assert.dom('[data-test-network-isolated-title]').hasText('Bitcoin');
  });
});
