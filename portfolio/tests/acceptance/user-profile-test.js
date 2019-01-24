
import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { ciSessionId } from '@cardstack/test-support/environment';
import { hubURL } from '@cardstack/plugin-utils/environment';
import { login } from '../helpers/login';

let user;

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('data-sources', 'portfolio-user').withAttributes({
      sourceType: 'portfolio-user',
    });

    user = factory.addResource('portfolio-users', 'test-user').withAttributes({
      name: 'Hassan Abdel-Rahman',
      'email-address': 'hassan@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    });

    factory.addResource('portfolio-users', 'another-user').withAttributes({
      name: 'Some Person',
      'email-address': 'anotheruser@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    });
  },
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

async function ensureUserLoggedOut() {
  await visit('/profile');

  if (document.querySelector('[data-test-signout-button]')) {
    await click('[data-test-signout-button]');
  }
}

module('Acceptance | user-profile', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  module('not logged in', function () {
    hooks.beforeEach(async function () {
      delete localStorage['cardstack-tools'];
    });

    hooks.afterEach(function () {
      delete localStorage['cardstack-tools'];
    });

    test('user sees the login form when they visit the profile URL without logging in', async function(assert) {
      await ensureUserLoggedOut();

      await visit('/profile');
      assert.equal(currentURL(), '/profile');

      assert.dom('[data-test-user-form]').doesNotExist();
      assert.dom('[data-test-login-form]').exists();
      assert.dom('[data-test-login-email]').exists();
      assert.dom('[data-test-login-password]').exists();
      assert.dom('[data-test-login-button]').exists();
    });

    test('user can see their profile after logging in', async function(assert) {
      await ensureUserLoggedOut();

      await visit('/profile');

      await fillIn('[data-test-login-email]', 'hassan@example.com');
      await fillIn('[data-test-login-password]', 'password')
      await click('[data-test-login-button]');
      await waitFor('[data-test-user-isolated]');

      assert.equal(currentURL(), '/profile');

      assert.dom('[data-test-user-name-display]').hasText('Hassan Abdel-Rahman');
      assert.dom('[data-test-user-email-display]').hasText('hassan@example.com');
      assert.dom('[data-test-user-submit]').doesNotExist();

      await click('[data-test-user-name-edit-button]');
      assert.dom('[data-test-user-name]').hasValue('Hassan Abdel-Rahman');

      await click('[data-test-user-email-edit-button]');
      assert.dom('[data-test-user-email]').hasValue('hassan@example.com');

      await click('[data-test-user-password-edit-button]');
      assert.dom('[data-test-user-current-password]').hasValue('');
      assert.dom('[data-test-user-new-password]').hasValue('');
      assert.dom('[data-test-user-confirm-new-password]').hasValue('');

      assert.dom('[data-test-user-submit]').isNotDisabled();
    });
  });

  module('logged in', function () {
    hooks.beforeEach(async function () {
      delete localStorage['cardstack-tools'];
      await login('hassan@example.com', 'password');
    });

    hooks.afterEach(async function () {
      if (document.querySelector('[data-test-signout-button]')) {
        await click('[data-test-signout-button]');
      }
      delete localStorage['cardstack-tools'];
    });

    test('the card is initialy rendered correctly', async function (assert) {
      // TODO we'll adjust routing to use session based routing so we dont
      // need the user ID in the URL
      await visit('/profile');

      assert.equal(currentURL(), '/profile');
      assert.dom('[data-test-user-name-display]').hasText('Hassan Abdel-Rahman');
      assert.dom('[data-test-user-email-display]').hasText('hassan@example.com');
      assert.dom('[data-test-user-submit]').doesNotExist();
    });

    test('reset button resets the form', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-name-edit-button]');
      await fillIn('[data-test-user-name]', 'Musa Abdel-Rahman');

      await click('[data-test-user-email-edit-button]');
      await fillIn('[data-test-user-email]', 'musa@example.com');

      await click('[data-test-user-password-edit-button]');
      await fillIn('[data-test-user-current-password]', 'password');
      await fillIn('[data-test-user-new-password]', 'password2');
      await fillIn('[data-test-user-confirm-new-password]', 'password2');

      await click('[data-test-user-reset]');

      assert.dom('[data-test-user-name-display]').hasText('Hassan Abdel-Rahman');
      assert.dom('[data-test-user-email-display]').hasText('hassan@example.com');
      assert.dom('[data-test-user-submit]').doesNotExist();

      await click('[data-test-user-name-edit-button]');
      assert.dom('[data-test-user-name]').hasValue('Hassan Abdel-Rahman');

      await click('[data-test-user-email-edit-button]');
      assert.dom('[data-test-user-email]').hasValue('hassan@example.com');

      await click('[data-test-user-password-edit-button]');
      assert.dom('[data-test-user-current-password]').hasValue('');
      assert.dom('[data-test-user-new-password]').hasValue('');
      assert.dom('[data-test-user-confirm-new-password]').hasValue('');
      assert.dom('[data-test-user-submit]').isNotDisabled();
    });

    test('reset button resets form to latest update', async function (assert) {
      await visit('/profile');

      assert.dom('[data-test-user-name-display]').hasText('Hassan Abdel-Rahman');
      assert.dom('[data-test-user-email-display]').hasText('hassan@example.com');

      await click('[data-test-user-name-edit-button]');
      await fillIn('[data-test-user-name]', 'Musa Abdel-Rahman');

      await click('[data-test-user-email-edit-button]');
      await fillIn('[data-test-user-email]', 'musa@example.com');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-success]');

      await click('[data-test-user-name-edit-button]');
      await fillIn('[data-test-user-name]', 'Hassan');

      await click('[data-test-user-email-edit-button]');
      await fillIn('[data-test-user-email]', 'hassannew@example.com');

      await click('[data-test-user-reset]');
      assert.dom('[data-test-user-name-display]').hasText('Musa Abdel-Rahman');
      assert.dom('[data-test-user-email-display]').hasText('musa@example.com');
    });

    test('the name and email can be updated together', async function (assert) {
      // TODO we'll adjust routing to use session based routing so we dont
      // need the user ID in the URL
      await visit('/profile');

      await click('[data-test-user-name-edit-button]');
      await click('[data-test-user-email-edit-button]');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await fillIn('[data-test-user-name]', 'Musa Abdel-Rahman');
      await fillIn('[data-test-user-email]', 'musa@example.com');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-success]');

      let users = await searchForUser('musa@example.com');
      assert.equal(users.length, 1);
      assert.equal(users[0].attributes['name'], 'Musa Abdel-Rahman');
    });

    test('the name can be individually updated', async function (assert) {
      // TODO we'll adjust routing to use session based routing so we dont
      // need the user ID in the URL
      await visit('/profile');

      await click('[data-test-user-name-edit-button]');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await fillIn('[data-test-user-name]', 'Musa Abdel-Rahman');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-success]');

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
      assert.equal(users[0].attributes['name'], 'Musa Abdel-Rahman');
    });

    test('the email can be individually updated', async function (assert) {
      // TODO we'll adjust routing to use session based routing so we dont
      // need the user ID in the URL
      await visit('/profile');

      await click('[data-test-user-email-edit-button]');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await fillIn('[data-test-user-email]', 'musa@example.com');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-success]');

      let users = await searchForUser('musa@example.com');
      assert.equal(users.length, 1);
      assert.equal(users[0].attributes['name'], 'Hassan Abdel-Rahman');
    });

    test('password can be updated', async function (assert) {
      await visit('/profile');

      assert.dom('[data-test-user-current-password]').doesNotExist();
      await click('[data-test-user-password-edit-button]');
      assert.dom('[data-test-user-submit]').isNotDisabled();
      await fillIn('[data-test-user-current-password]', 'password');
      assert.dom('[data-test-user-submit]').isDisabled();
      await fillIn('[data-test-user-new-password]', 'password2');
      assert.dom('[data-test-user-submit]').isDisabled();
      await fillIn('[data-test-user-confirm-new-password]', 'password2');
      assert.dom('[data-test-user-submit]').isNotDisabled();

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-success]');

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
      assert.notEqual(user.data.attributes['password-hash'], users[0].attributes['password-hash']);
    });

    test('all fields can be updated', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-name-edit-button]');
      await click('[data-test-user-email-edit-button]');
      await click('[data-test-user-password-edit-button]');

      await fillIn('[data-test-user-name]', 'Musa Abdel-Rahman');
      await fillIn('[data-test-user-email]', 'musa@example.com');
      await fillIn('[data-test-user-current-password]', 'password');
      await fillIn('[data-test-user-new-password]', 'password2');
      await fillIn('[data-test-user-confirm-new-password]', 'password2');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-success]');

      let users = await searchForUser('musa@example.com');
      assert.equal(users[0].attributes['name'], 'Musa Abdel-Rahman');
      assert.notEqual(user.data.attributes['password-hash'], users[0].attributes['password-hash']);
    });

    test('does not update when new password is different than confirmation password', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-password-edit-button]');
      await fillIn('[data-test-user-current-password]', 'password');
      await fillIn('[data-test-user-new-password]', 'password2');
      await fillIn('[data-test-user-confirm-new-password]', 'password3');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-error]');
      assert.dom('[data-test-user-update-error]').containsText(`The 'New Password' and 'Confirm New Password' fields do not match`);

      await fillIn('[data-test-user-confirm-new-password]', 'password3');
      assert.dom('[data-test-user-update-error]').doesNotExist();

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
      assert.equal(user.data.attributes['password-hash'], users[0].attributes['password-hash']);
    });

    test('does not update when new password is same as old password', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-password-edit-button]');
      await fillIn('[data-test-user-current-password]', 'password');
      await fillIn('[data-test-user-new-password]', 'password');
      await fillIn('[data-test-user-confirm-new-password]', 'password');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-error]');
      assert.dom('[data-test-user-update-error]').containsText(`The new password should be different than the old password.`);

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
      assert.equal(user.data.attributes['password-hash'], users[0].attributes['password-hash']);
    });

    test('does not update when new password is less than 8 characters', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-password-edit-button]');
      await fillIn('[data-test-user-current-password]', 'password');
      await fillIn('[data-test-user-new-password]', '1234567');
      await fillIn('[data-test-user-confirm-new-password]', '1234567');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-error]');
      assert.dom('[data-test-user-update-error]').containsText(`The new password must be at least 8 characters.`);

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
      assert.equal(user.data.attributes['password-hash'], users[0].attributes['password-hash']);
    });

    test('does not update when email changed to existing user`s email', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-email-edit-button]');
      await fillIn('[data-test-user-email]', 'anotheruser@example.com');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-error]');
      assert.dom('[data-test-user-update-error]').containsText(`A user with this email address already exists`);

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
    });

    test('does not update when current password is incorrect', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-password-edit-button]');
      await fillIn('[data-test-user-current-password]', 'not my password');
      await fillIn('[data-test-user-new-password]', 'password2');
      await fillIn('[data-test-user-confirm-new-password]', 'password2');

      await click('[data-test-user-submit]');
      await waitFor('[data-test-user-update-error]');
      assert.dom('[data-test-user-update-error]').containsText(`The provided current-password does not match the current password`);

      let users = await searchForUser('hassan@example.com');
      assert.equal(users.length, 1);
      assert.equal(user.data.attributes['password-hash'], users[0].attributes['password-hash']);
    });

    test('submit button is disabled if email is missing', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-email-edit-button]');
      await fillIn('[data-test-user-email]', '');
      assert.dom('[data-test-user-submit]').isDisabled();
    });

    test('submit button is disabled if name is missing', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-name-edit-button]');
      await fillIn('[data-test-user-name]', '');
      assert.dom('[data-test-user-submit]').isDisabled();
    });

    test('submit button is disabled if some but not all password fields are filled out', async function (assert) {
      await visit('/profile');

      await click('[data-test-user-password-edit-button]');
      await fillIn('[data-test-user-current-password]', 'password');
      assert.dom('[data-test-user-submit]').isDisabled();
      await fillIn('[data-test-user-new-password]', 'password2');
      assert.dom('[data-test-user-submit]').isDisabled();
    });
  });
});
