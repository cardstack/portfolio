
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  canLogin: computed('email', 'password', function() {
    return this.get('email') && this.get('password');
  }),

  doOnInput(field, {target:{value}}) {
    this.set('loginError', false);
    this.set(field, value);
  },

  doOnAuthenticationSuccess() {
    // Put any logic that you want to execute on auth success here
  },

  doOnAuthenticationFailed() {
    this.set('loginError', true);
  }
});