import { module, skip } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render, fillIn, click } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('data-sources', 'portfolio-user')
      .withAttributes({
        sourceType: 'portfolio-user',
      });
    factory.addResource('portfolio-users', 'user').withAttributes({
      name: 'Musa Abdel-Rahman',
      'email-address': 'musa@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    });


    // use world read grant solely for the purposes of testing the card template
    factory.addResource('grants', 'portfolio-users-world-read-grant')
      .withRelated('who', [{ type: 'groups', id: 'everyone' }])
      .withRelated('types', [{ type: 'content-types', id: 'portfolio-users' }])
      .withAttributes({
        'may-read-resource': true,
        'may-read-fields': true,
      });
  }
});

module('Card | user', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  // unsure how to mock the session, moving these tests to the acceptance tests

  skip('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "portfolio-user" "user" format="isolated"}}`);

    assert.dom('[data-test-user-name').hasValue('Musa Abdel-Rahman');
    assert.dom('[data-test-user-email').hasValue('musa@example.com');
    assert.dom('[data-test-user-current-password').hasValue('');
    assert.dom('[data-test-user-new-password').hasValue('');
    assert.dom('[data-test-user-confirm-new-password').hasValue('');
    assert.dom('[data-test-user-submit]').isNotDisabled();
    assert.dom('[data-test-portfolio-account-card]').exists();
    assert.dom('[data-test-portfolio-account-card-title]').hasText('Card Folio');
  });

  // unsure how to mock the session, moving these tests to the acceptance tests

  skip('reset button resets the form', async function(assert) {
    await render(hbs`{{cardstack-card-test "portfolio-user" "user" format="isolated"}}`);

    await fillIn('[data-test-user-name]', 'Hassan Abdel-Rahman');
    await fillIn('[data-test-user-email]', 'hassan@example.com');
    await fillIn('[data-test-user-current-password]', 'password');
    await fillIn('[data-test-user-new-password]', 'password2');
    await fillIn('[data-test-user-confirm-new-password]', 'password2');

    await click('[data-test-user-reset]');

    assert.dom('[data-test-user-name').hasValue('Musa Abdel-Rahman');
    assert.dom('[data-test-user-email').hasValue('musa@example.com');
    assert.dom('[data-test-user-current-password').hasValue('');
    assert.dom('[data-test-user-new-password').hasValue('');
    assert.dom('[data-test-user-confirm-new-password').hasValue('');
    assert.dom('[data-test-user-submit]').isNotDisabled();
  });

});
