import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(/*factory*/) {
  }
});

module('Card | user', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  skip('embedded format renders', async function(assert) {
    await renderCard('user', '123', 'embedded');
    assert.dom('[data-test-user-embedded-title]').hasText('Hello');
  });

  skip('isolated format renders', async function(assert) {
    await renderCard('user', '123', 'isolated');
    assert.dom('[data-test-user-isolated-title]').hasText('Hello');
  });
});
