import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { get } from 'lodash';
import layout from '../templates/isolated';

export default Component.extend({
  layout,
  store: service(),
  router: service(),

  submitRegistration: task(function * () {
    let adapter = this.store.adapterFor('register');
    let name = this.get('name');
    let email = this.get('email');
    let password = this.get('password');

    let response = yield fetch(`${adapter.host}/register`, {
      method: 'POST',
      headers: {
        "content-type": 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: 'portfolio-users',
          attributes: {
            name,
            password,
            'email-address': email,
          }
        }
      })
    });

    if (response.status === 200) {
      // TODO we should authenticate the user's session after registering
      // and then transition to the app card
      this.set('registrationSuccessful', true);
    } else  {
      let body = yield response.json();
      let message = get(body, 'errors[0].detail') || 'Errors encountered while performing registration';
      this.set('registrationError', message);
    }
  }).drop(),

  formCanBeSubmitted: computed('name', 'email', 'password', function() {
    return this.get('name') && this.get('email') && this.get('password');
  }),

  doOnInput(field, {target:{value}}) {
    this.set('registrationSuccessful', false);
    this.set('registrationError', null);
    this.set(field, value);
  },

  transitionToAppCard() {
    this.router.transitionTo('cardstack.index');
  },

  submitForm(ev) {
    ev.preventDefault();
    this.get('submitRegistration').perform();
  }

});