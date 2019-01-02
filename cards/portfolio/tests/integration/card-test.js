import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('portfolios', '123')
      .withAttributes({
        title: 'Hello'
      })
  }
});

module('Card | portfolio', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await renderCard('portfolio', '123', 'embedded');
    assert.dom('[data-test-portfolio-embedded-title]').hasText('Hello');
  });

  test('isolated format renders', async function(assert) {
    await renderCard('portfolio', '123', 'isolated');
    assert.dom('[data-test-portfolio-isolated-title]').hasText('Hello');
  });
});
