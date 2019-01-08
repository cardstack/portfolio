import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render, getContext, waitFor, click, fillIn } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs } from '@cardstack/test-support/test-helpers';
import { setupRenderingTest } from 'ember-qunit';

const scenario = new Fixtures({
  async create(factory) {
    factory.addResource('data-sources', 'portfolio-user')
      .withAttributes({
        sourceType: 'portfolio-user',
      });
    factory.addResource('portfolio-users', 'test-user').withAttributes({
      name: 'Hassan Abdel-Rahman',
      'email-address': 'hassan@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    });
  },
});

module('Card | register', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('login component can trigger onAuthenticationSuccess action for successful authentication', async function(assert) {
    let didAuthenticate = false;
    let context = getContext();
    context.set('doOnSuccess', () => {
      didAuthenticate = true;
      context.set('authenticated', true);
    });
    await render(hbs`
      {{#password-login onAuthenticationSuccess=(action doOnSuccess) as |login|}}
        <input data-test-email
               type="text"
               value={{email}}
               oninput={{action (mut email) value="target.value"}}>
        <input data-test-password
               type="password"
               value={{password}}
               oninput={{action (mut password) value="target.value"}}>
        <button data-test-login-button {{action login email password}}>Login</button>
      {{/password-login}}
      {{#if authenticated}}
        <div data-test-authenticated></div>
      {{/if}}
    `);

    await fillIn('[data-test-email]', 'hassan@example.com');
    await fillIn('[data-test-password]', 'password')
    await click('[data-test-login-button]');
    await waitFor('[data-test-authenticated]');

    assert.equal(didAuthenticate, true);
  });

  test('login component can trigger onAuthenticationFailed action for unsuccessful authentication', async function(assert) {
    let didFailAuthentication = false;
    let context = getContext();
    context.set('doOnFail', () => {
      didFailAuthentication = true;
      context.set('authenticationFailed', true);
    });
    await render(hbs`
      {{#password-login onAuthenticationFailed=(action doOnFail) as |login|}}
        <input data-test-email
               type="text"
               value={{email}}
               oninput={{action (mut email) value="target.value"}}>
        <input data-test-password
               type="password"
               value={{password}}
               oninput={{action (mut password) value="target.value"}}>
        <button data-test-login-button {{action login email password}}>Login</button>
      {{/password-login}}
      {{#if authenticationFailed}}
        <div data-test-not-authenticated></div>
      {{/if}}
    `);

    await fillIn('[data-test-email]', 'hassan@example.com');
    await fillIn('[data-test-password]', 'not my password')
    await click('[data-test-login-button]');
    await waitFor('[data-test-not-authenticated]');

    assert.equal(didFailAuthentication, true);
  });

});