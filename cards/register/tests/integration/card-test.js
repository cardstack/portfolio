import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render, waitFor, click, fillIn } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupCardTest, setupURLs } from '@cardstack/test-support/test-helpers';
import { ciSessionId } from '@cardstack/test-support/environment';
import { hubURL } from '@cardstack/plugin-utils/environment';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('registers', 'portfolio-users');
    factory.addResource('portfolio-users', 'existing-user').withAttributes({
      'email-address': 'existing@example.com'
    })
  },
  destroy() {
    return [{ type: 'portfolio-users' }];
  }
});

async function searchForUser(email) {
  let url = `${hubURL}/api/portfolio-users?filter[email-address][exact]=${email}`;
  let response = await fetch(url, {
    headers: {
      authorization: `Bearer ${ciSessionId}`,
      "content-type": 'application/vnd.api+json'
    }
  });
  return (await response.json()).data;
}

module('Card | register', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "register" "portfolio-users" format="isolated"}}`);
    assert.dom('[data-test-registration-name]').exists();
    assert.dom('[data-test-registration-email]').exists();
    assert.dom('[data-test-registration-password]').exists();
  });

  test('submit button is enabled after all fields are filled in', async function(assert) {
    await render(hbs`{{cardstack-card-test "register" "portfolio-users" format="isolated"}}`);

    assert.dom('[data-test-registration-submit]').isDisabled();
    await fillIn('[data-test-registration-name]', 'Van Gogh');
    assert.dom('[data-test-registration-submit]').isDisabled();
    await fillIn('[data-test-registration-email]', 'vangogh@example.com');
    assert.dom('[data-test-registration-submit]').isDisabled();
    await fillIn('[data-test-registration-password]', 'password');

    assert.dom('[data-test-registration-submit]').isNotDisabled();
  });

  test('can successfully register a user', async function(assert) {
    await render(hbs`{{cardstack-card-test "register" "portfolio-users" format="isolated"}}`);
    assert.dom('[data-test-registration-success]').doesNotExist();

    await fillIn('[data-test-registration-name]', 'Van Gogh');
    await fillIn('[data-test-registration-email]', 'ringo@example.com');
    await fillIn('[data-test-registration-password]', 'password');
    await click('[data-test-registration-submit]');

    await waitFor('[data-test-registration-success]');

    let users = await searchForUser('ringo@example.com');
    assert.equal(users.length, 1);
    assert.equal(users[0].attributes['email-address'], 'ringo@example.com');
  });

  test('it shows an error when email belongs to a user that already exists', async function(assert) {
    let users = await searchForUser('existing@example.com');
    assert.equal(users.length, 1, 'the test starts out with just one "existing@example.com"');

    await render(hbs`{{cardstack-card-test "register" "portfolio-users" format="isolated"}}`);
    assert.dom('[data-test-registration-error]').doesNotExist();

    await fillIn('[data-test-registration-name]', 'Van Gogh');
    await fillIn('[data-test-registration-email]', 'existing@example.com');
    await fillIn('[data-test-registration-password]', 'password');
    await click('[data-test-registration-submit]');

    await waitFor('[data-test-registration-error]');
    assert.dom('[data-test-registration-error]').hasTextContaining('User already exists with this email address');

    users = await searchForUser('existing@example.com');
    assert.equal(users.length, 1, "A new user account was not created");

    await fillIn('[data-test-registration-email]', 'vangogh@example.com');
    assert.dom('[data-test-registration-error]').doesNotExist();
  });

  test('it shows an error when password is too short', async function(assert) {
    await render(hbs`{{cardstack-card-test "register" "portfolio-users" format="isolated"}}`);
    assert.dom('[data-test-registration-error]').doesNotExist();

    await fillIn('[data-test-registration-name]', 'Van Gogh');
    await fillIn('[data-test-registration-email]', 'vangogh@example.com');
    await fillIn('[data-test-registration-password]', 'pa');
    await click('[data-test-registration-submit]');

    await waitFor('[data-test-registration-error]');
    assert.dom('[data-test-registration-error]').hasTextContaining('The password length must be at least 8 characters');

    let users = await searchForUser('vangogh@example.com');
    assert.equal(users.length, 0);

    await fillIn('[data-test-registration-password]', 'password');
    assert.dom('[data-test-registration-error]').doesNotExist();
  });

});
