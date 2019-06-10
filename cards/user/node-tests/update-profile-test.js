const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const supertest = require('supertest');
const Koa = require('koa');
const { hashPassword, comparePassword } = require('portfolio-crypto');

const cardDir = join(__dirname, '../../');

let factory, env, searchers, request, auth;

async function createUser(email, password = 'my secrets', name = 'Van Gogh') {
  let writers = env.lookup('hub:writers');
  let { data: user } = await writers.create(env.session, 'portfolio-users', {
    data: {
      type: 'portfolio-users',
      attributes: {
        name,
        'email-address': email,
        'password-hash': await hashPassword(password)
      }
    }
  });

  let { id, type } = user;
  let { token } = await auth.createToken({ id, type }, 30);

  return { user, token };
}

describe('portfolio-users', function () {
  beforeEach(async function () {
    factory = new JSONAPIFactory();

    // Make all content types available from the cards in our application aviailable for us to use
    for (let cardName of readdirSync(cardDir)) {
      let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
      if (!existsSync(schemaFile)) { continue; }
      factory.importModels(require(schemaFile)());
    }

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    auth = env.lookup('plugin-middleware:@cardstack/authentication/cardstack/middleware');
    let app = new Koa();
    app.use(env.lookup('hub:middleware-stack').middleware());
    request = supertest(app.callback());
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('/update-profile', function () {
    it('supports CORS preflight for update-profile endpoint', async function () {
      let response = await request.options('/update-profile');
      expect(response).hasStatus(200);
      expect(response.headers['access-control-allow-methods']).matches(/POST/);
      expect(response.headers['access-control-allow-headers']).matches(/Authorization/);
    });

    it('can change the password for a portfolio-user', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com', 'password1');
      let response = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: {
            'current-password': 'password1',
            'new-password': 'password2'
          }
        }
      });

      expect(response).hasStatus(200);

      let { data: user } = await searchers.get(env.session, 'local-hub', type, id);
      expect(await comparePassword('password2', user.attributes['password-hash'])).to.equal(true);
    });

    it('does not expose the password-hash to the user when updating profile', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com');
      let { body: { data: user } } = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: { name: 'Hassan' }
        }
      });

      expect(user.attributes).to.not.have.property('password-hash');
    });

    it('can change the name for a portfolio-user', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com', 'password', 'Musa');
      let { body: { data: user } } = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: { name: 'Hassan' }
        }
      });

      expect(user).to.have.deep.property('attributes.name', 'Hassan');
      user = (await searchers.get(env.session, 'local-hub', type, id)).data;

      expect(user).to.have.deep.property('attributes.name', 'Hassan');
    });

    it('can change the email for a portfolio-user', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com');
      let { body: { data: user } } = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: { 'email-address': 'vangogh@example.com' }
        }
      });

      expect(user).to.have.deep.property('attributes.email-address', 'vangogh@example.com');
      user = (await searchers.get(env.session, 'local-hub', type, id)).data;

      expect(user).to.have.deep.property('attributes.email-address', 'vangogh@example.com');
    });

    it('can set the email to the current value', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com');
      let { body: { data: user } } = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: { 'email-address': 'hassan@example.com' }
        }
      });

      expect(user).to.have.deep.property('attributes.email-address', 'hassan@example.com');
      user = (await searchers.get(env.session, 'local-hub', type, id)).data;

      expect(user).to.have.deep.property('attributes.email-address', 'hassan@example.com');
    });

    it('does not honor profile update requests that have no session', async function () {
      let { user: { id, type } } = await createUser('hassan@example.com');
      let response = await request.post('/update-profile').send({
        data: {
          type, id,
          attributes: { 'email-address': 'vangogh@example.com' }
        }
      });

      expect(response).hasStatus(401);
      expect(response.body.errors).collectionContains({
        detail: "Unable to validate the session while updating profile"
      });
    });

    it('does not honor profile update requests that have invalid session', async function () {
      let { user: { id, type } } = await createUser('hassan@example.com');
      let response = await request.post('/update-profile').set('authorization', `Bearer not-real`).send({
        data: {
          type, id,
          attributes: { 'email-address': 'vangogh@example.com' }
        }
      });

      expect(response).hasStatus(401);
      expect(response.body.errors).collectionContains({
        detail: "Unable to validate the session while updating profile"
      });
    });

    it('does not honor profile update requests for updates to users that do not match session', async function () {
      let { token } = await createUser('vangogh@example.com');
      let { user: { id, type } } = await createUser('hassan@example.com');
      let response = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: { 'email-address': 'blah@example.com' }
        }
      });

      expect(response).hasStatus(401);
      expect(response.body.errors).collectionContains({
        detail: "Unable to validate the session while updating profile"
      });
    });

    it('does not change password when supplied current password does not match existing current password', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com', 'password1');
      let { data: { attributes: { 'password-hash': hash } } } = await searchers.get(env.session, 'local-hub', type, id);
      let response = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: {
            'current-password': 'xxx',
            'new-password': 'password2'
          }
        }
      });

      expect(response).hasStatus(401);
      expect(response.body.errors).collectionContains({
        detail: "The provided current-password does not match the current password"
      });

      let { data: user } = await searchers.get(env.session, 'local-hub', type, id);
      expect(hash).to.equal(user.attributes['password-hash']);
    });

    it('does not change password when new password is too short', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com', 'password1');
      let { data: { attributes: { 'password-hash': hash } } } = await searchers.get(env.session, 'local-hub', type, id);
      let response = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: {
            'current-password': 'password1',
            'new-password': 'small'
          }
        }
      });

      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: `The provided new password is less than 8 characters`
      });

      let { data: user } = await searchers.get(env.session, 'local-hub', type, id);
      expect(hash).to.equal(user.attributes['password-hash']);
    });

    it('does not change email to an email that is being used by another user', async function () {
      await createUser('vangogh@example.com');
      let { token, user: { id, type } } = await createUser('hassan@example.com');
      let response = await request.post('/update-profile').set('authorization', `Bearer ${token}`).send({
        data: {
          type, id,
          attributes: {
            'email-address': 'vangogh@example.com',
          }
        }
      });

      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: "A user with this email address already exists"
      });

      let { data: user } = await searchers.get(env.session, 'local-hub', type, id);
      expect(user).to.have.deep.property('attributes.email-address', 'hassan@example.com');
    });
  });
});
