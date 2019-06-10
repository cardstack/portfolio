const { declareInjections } = require('@cardstack/di');
const Error = require('@cardstack/plugin-utils/error');
const Session = require('@cardstack/plugin-utils/session');
const { get } = require('lodash');
const compose = require('koa-compose');
const route = require('koa-better-route');
const koaJSONBody = require('koa-json-body');
const { hashPassword, comparePassword } = require('portfolio-crypto');

const { withJsonErrorHandling } = Error;
const prefix = 'update-profile';
const minPasswordLength = 8;

function addCorsHeaders(response) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = declareInjections({
  writers: 'hub:writers',
  searchers: 'hub:searchers',
},

  class PortfolioProfileUpdate {
    get after() {
      return 'authentication';
    }

    middleware() {
      return compose([
        this._updateProfilePreflight(),
        this._updateProfile(),
      ]);
    }

    _updateProfilePreflight() {
      return route.options(`/${prefix}`, async (ctxt) => {
        addCorsHeaders(ctxt.response);
        ctxt.status = 200;
      });
    }

    _updateProfile() {
      return route.post(`/${prefix}`, compose([
        koaJSONBody({ limit: '1mb' }),
        async (ctxt) => {
          addCorsHeaders(ctxt.response);
          await withJsonErrorHandling(ctxt, async () => {
            let session = get(ctxt, 'state.cardstackSession');
            let requestedId = get(ctxt, 'request.body.data.id');
            let requestedType = get(ctxt, 'request.body.data.type');
            if (!session || session.id !== requestedId || session.type !== requestedType) {
              ctxt.status = 401;
              ctxt.body = {
                errors: [{
                  title: "Not authorized",
                  detail: "Unable to validate the session while updating profile"
                }]
              };
              return;
            }

            let { data: user } = await this.searchers.get(Session.INTERNAL_PRIVILEGED, 'local-hub', session.type, session.id);
            let { attributes: { 'password-hash': hash } } = user;

            let currentPassword = get(ctxt, 'request.body.data.attributes.current-password');
            let newPassword = get(ctxt, 'request.body.data.attributes.new-password');
            if (currentPassword || newPassword) {
              if (!(await comparePassword(currentPassword, hash))) {
                ctxt.status = 401;
                ctxt.body = {
                  errors: [{
                    title: "Not authorized",
                    detail: "The provided current-password does not match the current password"
                  }]
                };
                return;
              }
              if (!newPassword || newPassword.length < minPasswordLength) {
                ctxt.status = 400;
                ctxt.body = {
                  errors: [{
                    title: "Invalid Password",
                    detail: `The provided new password is less than ${minPasswordLength} characters`
                  }]
                };
                return;
              }

              let newHash = await hashPassword(newPassword);

              user.attributes['password-hash'] = newHash;
            }

            let email = get(ctxt, 'request.body.data.attributes.email-address');
            if (email) {
              let { data: existingEmails } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
                filter: {
                  type: { exact: 'portfolio-users' },
                  'email-address': { exact: email }
                },
                page: { size: 1 }
              });
              existingEmails = existingEmails.filter(i => i.id !== requestedId);

              if (existingEmails.length) {
                ctxt.status = 400;
                ctxt.body = {
                  errors: [{
                    title: "Email Already in Use",
                    detail: "A user with this email address already exists"
                  }]
                };
                return;
              }
              user.attributes['email-address'] = email;
            }

            let name = get(ctxt, 'request.body.data.attributes.name');
            user.attributes.name = name ? name : user.attributes.name;

            let { data: { id, type } } = await this.writers.update(Session.INTERNAL_PRIVILEGED, 'portfolio-users', user.id, { data: user });
            let readAuthorizedUser = await this.searchers.get(session, 'local-hub', type, id);

            ctxt.status = 200;
            ctxt.body = readAuthorizedUser;
          });
        }
      ]));
    }
  });