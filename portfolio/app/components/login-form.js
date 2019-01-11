import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  router: service(),

  canLogin: computed('email', 'password', function () {
    return this.get('email') && this.get('password');
  }),

  doOnInput(field, { target: { value } }) {
    this.set('loginError', false);
    this.set(field, value);
  },

  submitForm(login, email, password, evt) {
    evt.preventDefault();
    if (typeof login !== 'function') { return; }

    login(email, password);
  },

  doOnAuthenticationSuccess() {
    let doAfterLogin = this.get('doAfterLogin');
    if (typeof doAfterLogin === 'function') {
      doAfterLogin();
    }
  },

  doOnAuthenticationFailed() {
    this.set('loginError', true);
  },

  transitionToRegister() {
    this.router.transitionTo('cardstack.content', 'register');
  }
});
