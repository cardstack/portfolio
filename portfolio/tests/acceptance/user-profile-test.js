
import { module, test } from 'qunit';
import { visit, /*currentURL,*/ click, fillIn, waitFor } from '@ember/test-helpers';
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

module('Acceptance | user-profile', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(async function() {
    delete localStorage['cardstack-tools'];
    await login('hassan@example.com', 'password');
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('the name and email can be updated', async function(assert) {
    // TODO we'll adjust routing to use session based routing so we dont
    // need the user ID in the URL
    await visit('/portfolio-users/test-user');

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

  test('password can be updated', async function(assert) {
    await visit('/portfolio-users/test-user');

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

  test('all fields can be updated', async function(assert) {
    await visit('/portfolio-users/test-user');

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

  test('does not update when new password is different than confirmation password', async function(assert) {
    await visit('/portfolio-users/test-user');

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

  test('does not update when new password is same as old password', async function(assert) {
    await visit('/portfolio-users/test-user');

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

  test('does not update when new password is less than 8 characters', async function(assert) {
    await visit('/portfolio-users/test-user');

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

  test('does not update when email changed to existing user`s email', async function(assert) {
    await visit('/portfolio-users/test-user');

    await fillIn('[data-test-user-email]', 'anotheruser@example.com');

    await click('[data-test-user-submit]');
    await waitFor('[data-test-user-update-error]');
    assert.dom('[data-test-user-update-error]').containsText(`A user with this email address already exists`);

    let users = await searchForUser('hassan@example.com');
    assert.equal(users.length, 1);
  });

  test('does not update when current password is incorrect', async function(assert) {
    await visit('/portfolio-users/test-user');

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

  test('submit button is disabled if email is missing', async function(assert) {
    await visit('/portfolio-users/test-user');

    await fillIn('[data-test-user-email]', '');
    assert.dom('[data-test-user-submit]').isDisabled();
  });

  test('submit button is disabled if name is missing', async function(assert) {
    await visit('/portfolio-users/test-user');

    await fillIn('[data-test-user-name]', '');
    assert.dom('[data-test-user-submit]').isDisabled();
  });

  test('submit button is disabled if some but not all password fields are filled ou', async function(assert) {
    await visit('/portfolio-users/test-user');

    await fillIn('[data-test-user-current-password]', 'password');
    assert.dom('[data-test-user-submit]').isDisabled();
    await fillIn('[data-test-user-new-password]', 'password2');
    assert.dom('[data-test-user-submit]').isDisabled();
  });
});