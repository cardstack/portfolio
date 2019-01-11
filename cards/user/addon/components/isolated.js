import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { get } from 'lodash';
import layout from '../templates/isolated';
import { getOwner } from '@ember/application';

const passwordMinLength = 8;

export default Component.extend({
  layout,
  store: service(),
  session: service(),
  router: service(),

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
      this.set('formError', `The 'New Password' and 'Confirm New Password' fields do not match`);
      return;
    }
    if (newPassword && newPassword.length < passwordMinLength) {
      this.set('formError', `The new password must be at least 8 characters.`);
      return;
    }
    if (newPassword && currentPassword && newPassword === currentPassword) {
      this.set('formError', `The new password should be different than the old password.`);
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

    if (response.status === 200) {
      this.set('updateSuccessful', true);

      let routeName = this.router.get('currentRouteName');
      let currentRoute = getOwner(this).lookup(`route:${routeName}`);
      currentRoute.refresh();

      this.setProperties({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      this.resetEditing();
    } else  {
      let body = yield response.json();
      let message = get(body, 'errors[0].detail') || 'Errors encountered while updating profile';
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

  resetEditing() {
    this.set('isEditable', false);
    this.set('editName', false);
    this.set('editEmail', false);
    this.set('editPassword', false);
  },

  resetForm() {
    this.set('formError', null);
    this.set('updateSuccessful', false);
    this.setProperties({
      email: this.get('content.emailAddress'),
      name: this.get('content.name'),
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    this.resetEditing();
  },

  doOnInput(field, {target:{value}}) {
    this.set('formError', null);
    this.set('updateSuccessful', false);
    this.set(field, value);
  },

  submitForm(ev) {
    ev.preventDefault();
    this.get('updateUser').perform();
  }
});
