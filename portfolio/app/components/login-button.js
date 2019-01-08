import Component from '@ember/component';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import ENV from '../config/environment';

export default Component.extend({
  tagName: '',
  usePasswordAuth: computed(function() {
    if (ENV.environment !== 'test') { return true; }

    let owner = getOwner(this);
    let mockLogin = owner.lookup('service:mock-login');
    return mockLogin && mockLogin.get('disabled');
  })
});