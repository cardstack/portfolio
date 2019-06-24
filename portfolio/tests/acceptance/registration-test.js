import { module, skip } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('registers', 'portfolio-users');
  },
  destroy() {
    return [{ type: 'portfolio-users' }];
  }
});

module('Acceptance | register', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  skip('TODO user is logged in after registration and transitioned to their portfolio card', async function(/*assert*/) {
  });
});