import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(/*factory*/) {
  }
});

module('Card | register', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  skip('isolated format renders', async function(assert) {
    await renderCard('register', '123', 'isolated');
    assert.dom('[data-test-register-isolated-title]').hasText('Hello');
  });
});
