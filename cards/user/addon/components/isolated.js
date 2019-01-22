import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { get } from 'lodash';
import layout from '../templates/isolated';

const passwordMinLength = 8;

export default Component.extend({
  layout,
  router: service(),
  store: service(),
  session: service(),

  userInitials: computed('content.name', function () {
    let name = this.get('content.name').trim();
    if (!name) { return; }

    let names = name.split(/\s\s*/);
    if (names.length > 1) {
      return name[0] + names[names.length - 1][0];
    }
    return name[0];
  }),

  init() {
    this._super();
    this.resetForm();
  },

  updateUser: task(function * () {
    let adapter = this.store.adapterFor('portfolio-user');
    let name = this.get('name');
    let email = this.get('email');
    let newPassword = this.get('newPassword');
    let confirmNewPassword = this.get('confirmNewPassword');
    let currentPassword = this.get('currentPassword');

    if (newPassword && newPassword !== confirmNewPassword) {
      this.set('formError', `The 'New Password' and 'Confirm New Password' fields do not match.`);
      this.set('newPasswordError', true);
      return;
    }
    if (newPassword && newPassword.length < passwordMinLength) {
      this.set('formError', `The new password must be at least 8 characters.`);
      this.set('newPasswordError', true);
      return;
    }
    if (newPassword && currentPassword && newPassword === currentPassword) {
      this.set('formError', `The new password should be different than the old password.`);
      this.set('oldPasswordError', true);
      this.set('newPasswordError', true);
      return;
    }

    let attributes = { name, 'email-address': email };
    if (currentPassword && newPassword) {
      attributes['current-password'] = currentPassword;
      attributes['new-password'] = newPassword;
    }

    let token = this.get('session.data.authenticated.data.meta.token');
    let response = yield fetch(`${adapter.host}/update-profile`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          id: this.get('content.id'),
          type: 'portfolio-users',
          attributes
        }
      })
    });

    let body = yield response.json();

    if (response.status === 200) {
      this.store.pushPayload('portfolio-user', body);
      this.resetForm();
      this.set('updateSuccessful', true);
    } else {
      let message = get(body, 'errors[0].detail') || 'Errors encountered while updating profile.';
      this.set('formError', message);
    }
  }).drop(),

  formCanBeSubmitted: computed('name', 'email', 'newPassword', 'currentPassword', 'confirmNewPassword', function() {
    let currentPassword = this.get('currentPassword');
    let newPassword = this.get('newPassword');
    let confirmNewPassword = this.get('confirmNewPassword');

    return this.get('name') && this.get('email') && (
      (!currentPassword && !newPassword && !confirmNewPassword) ||
      (currentPassword && newPassword && confirmNewPassword)
    );
  }),

  editField(field) {
    this.set(field, true);
    this.set('isEditable', true);
  },

  resetForm() {
    this.set('formError', null);
    this.set('newPasswordError', false);
    this.set('oldPasswordError', false);
    this.set('updateSuccessful', false);
    this.setProperties({
      email: this.get('content.emailAddress'),
      name: this.get('content.name'),
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    this.set('isEditable', false);
    this.set('editName', false);
    this.set('editEmail', false);
    this.set('editPassword', false);
  },

  doOnInput(field, {target:{value}}) {
    this.set('formError', null);
    this.set('newPasswordError', false);
    this.set('oldPasswordError', false);
    this.set('updateSuccessful', false);
    this.set(field, value);
  },

  submitForm(ev) {
    ev.preventDefault();
    this.get('updateUser').perform();
  },

  transitionToPortfolio() {
    this.router.transitionTo('cardstack.index');
  }
});
