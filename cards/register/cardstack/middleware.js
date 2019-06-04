const { declareInjections } = require('@cardstack/di');
const Error = require('@cardstack/plugin-utils/error');
const Session = require('@cardstack/plugin-utils/session');
const { get } = require('lodash');
const compose = require('koa-compose');
const route = require('koa-better-route');
const koaJSONBody = require('koa-json-body');
const { hashPassword } = require('portfolio-crypto');

const { withJsonErrorHandling } = Error;
const prefix = 'register';
const minPasswordLength = 8;

function addCorsHeaders(response) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = declareInjections({
  writers: 'hub:writers',
  searchers: 'hub:searchers',
  sessions: 'hub:sessions'
},

  class PortfolioRegister {
    middleware() {
      return compose([
        this._registerPreflight(),
        this._register(),
      ]);
    }

    _registerPreflight() {
      return route.options(`/${prefix}`, async (ctxt) => {
        addCorsHeaders(ctxt.response);
        ctxt.status = 200;
      });
    }

    _register() {
      return route.post(`/${prefix}`, compose([
        koaJSONBody({ limit: '1mb' }),
        async (ctxt) => {
          addCorsHeaders(ctxt.response);
          await withJsonErrorHandling(ctxt, async () => {
            let email = get(ctxt, 'request.body.data.attributes.email-address');
            if (!email) {
              ctxt.status = 400;
              ctxt.body = {
                errors: [{
                  title: "Bad format",
                  detail: "The register request is missing email in the data.attributes.email-address field"
                }]
              };
              return;
            }

            let password = get(ctxt, 'request.body.data.attributes.password');
            if (!password) {
              ctxt.status = 400;
              ctxt.body = {
                errors: [{
                  title: "Bad format",
                  detail: "The register request is missing the password in the data.attributes.password field"
                }]
              };
              return;
            } else if (password.length < minPasswordLength) {
              ctxt.status = 400;
              ctxt.body = {
                errors: [{
                  title: "Bad format",
                  detail: "The password length must be at least 8 characters"
                }]
              };
              return;
            }

            let name = get(ctxt, 'request.body.data.attributes.name');
            if (!name) {
              ctxt.status = 400;
              ctxt.body = {
                errors: [{
                  title: "Bad format",
                  detail: "The register request is missing the name in the data.attributes.name field"
                }]
              };
              return;
            }

            let { data: existingUsers } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
              filter: {
                type: { exact: 'portfolio-users' },
                'email-address': { exact: email }
              },
              page: { size: 1 }
            });
            if (existingUsers.length) {
              ctxt.status = 400;
              ctxt.body = {
                errors: [{
                  title: "User Exists",
                  detail: "User already exists with this email address"
                }]
              };
              return;
            }

            let hash = await hashPassword(password);

            let { data: { id, type } } = await this.writers.create(Session.INTERNAL_PRIVILEGED, 'portfolio-users', {
              data: {
                type: 'portfolio-users',
                attributes: {
                  name,
                  'email-address': email,
                  'password-hash': hash
                }
              }
            });
            await this.writers.create(Session.INTERNAL_PRIVILEGED, 'portfolios', {
              data: {
                type: 'portfolios',
                attributes: { title: 'My Cardfolio' },
                relationships: {
                  wallets: { data: [] },
                  user: { data: { type, id } }
                }
              }
            });

            let userSession = this.sessions.create(type, id);
            let readAuthorizedUser = await this.searchers.get(userSession, 'local-hub', type, id);

            ctxt.status = 200;
            ctxt.body = readAuthorizedUser;
          });
        }
      ]));
    }
  });