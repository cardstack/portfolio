import { module, skip } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(/*factory*/) {
  }
});

module('Card | user', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  skip('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "user" "123" format="embedded"}}`);
    assert.dom('[data-test-user-embedded-title]').hasText('Hello');
  });

  skip('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "user" "123" format="isolated"}}`);
    assert.dom('[data-test-user-isolated-title]').hasText('Hello');
  });
});
