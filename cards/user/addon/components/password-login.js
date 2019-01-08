import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import Component from '@ember/component';
import layout from '../templates/password-login';

export default Component.extend({
  layout,
  tagName: '',
  passwordLogin: service(),

  init() {
    this._super();

    let service = get(this, 'passwordLogin');
    let onAuthentication = get(this, 'onAuthenticationSuccess');
    let onPartialAuthentication = get(this, 'onPartialAuthenticationSuccess');
    let onAuthenticationFailed = get(this, 'onAuthenticationFailed');

    if (typeof onAuthentication === 'function') {
      set(service, 'authenticationHandler', onAuthentication.bind(this));
    }
    if (typeof onPartialAuthentication === 'function') {
      set(service, 'partialAuthenticationHandler', onPartialAuthentication.bind(this));
    }
    if (typeof onAuthenticationFailed === 'function') {
      set(service, 'authenticationFailedHandler', onAuthenticationFailed.bind(this));
    }
  },
});
