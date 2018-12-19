import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('<%= dasherizedModuleName %>s', '123')
      .withAttributes({
        title: 'Hello'
      })
  }
});

module('Card | <%= dasherizedModuleName %>', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await renderCard('<%= dasherizedModuleName %>', '123', 'embedded');
    assert.dom('[data-test-<%= dasherizedModuleName %>-embedded-title]').hasText('Hello');
  });

  test('isolated format renders', async function(assert) {
    await renderCard('<%= dasherizedModuleName %>', '123', 'isolated');
    assert.dom('[data-test-<%= dasherizedModuleName %>-isolated-title]').hasText('Hello');
  });
});
