const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const supertest = require('supertest');
const Koa = require('koa');
const cardDir = join(__dirname, '../');
const { comparePassword } = require('../cardstack/crypto');

let factory, env, searchers, request, sessions, auth;

async function createUser(email, password = 'my secrets', name = 'Van Gogh') {
  // use middleware to create user instead of writers so that the password hash is created correctly
  let { body: { data: user } } = await request.post('/register').send({
    data: {
      type: 'portfolio-users',
      attributes: {
        name,
        'email-address': email,
        password: password
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

    factory.addResource('data-sources', 'portfolio')
      .withAttributes({
        sourceType: 'portfolio',
      });

    let schemaFile = join(cardDir, 'cardstack', 'static-model.js');
    factory.importModels(require(schemaFile)());

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    sessions = env.lookup('hub:sessions');
    auth = env.lookup('plugin-middleware:@cardstack/authentication/cardstack/middleware');
    let app = new Koa();
    app.use(env.lookup('hub:middleware-stack').middleware());
    request = supertest(app.callback());
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('grants', function () {
    it('does not allow users to view other users', async function () {
      let { user: hassan } = await createUser('hassan@example.com');
      let { user: vanGogh } = await createUser('vangogh@example.com');
      let vanGoghSession = sessions.create(vanGogh.type, vanGogh.id);

      let error;
      try {
        await searchers.getFromControllingBranch(vanGoghSession, hassan.type, hassan.id);
      } catch (e) {
        error = e;
      }

      expect(error.status).to.equal(404);
    });

    it('does not expose password-hash when getting a user', async function () {
      let { user: { id, type } } = await createUser('hassan@example.com');
      let session = sessions.create(type, id);
      let { data: self } = await searchers.getFromControllingBranch(session, type, id);

      expect(self.attributes).to.not.have.property('password-hash');
    });
  });

  describe('/register', function () {
    it('supports CORS preflight for register endpoint', async function () {
      let response = await request.options('/register');
      expect(response).hasStatus(200);
      expect(response.headers['access-control-allow-methods']).matches(/POST/);
    });

    it('can register a new portfolio-user', async function () {
      let response = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': 'hassan@example.com',
            password: 'my secrets'
          }
        }
      });
      expect(response).hasStatus(200);

      let { data: users } = await searchers.search(env.session, 'master', {
        filter: { type: { exact: 'portfolio-users' } }
      })

      expect(users.length).to.equal(1);

      expect(users[0]).to.have.deep.property('attributes.email-address', 'hassan@example.com');
      expect(users[0]).to.have.deep.property('attributes.name', 'Hassan');
      expect(await comparePassword('my secrets', users[0].attributes['password-hash'])).to.equal(true);
    });

    it('does not register a user when the email is missing in register request', async function () {
      let response = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': '',
            password: 'my secrets'
          }
        }
      });
      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: "The register request is missing email in the data.attributes.email-address field"
      });
    });

    it('does not register a user when the name is missing in register request', async function () {
      let response = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: '',
            'email-address': 'hassan@example.com',
            password: 'my secrets'
          }
        }
      });
      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: "The register request is missing the name in the data.attributes.name field"
      });
    });

    it('does not register a user when the password is missing in register request', async function () {
      let response = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': 'hassan@example.com',
            password: ''
          }
        }
      });
      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: "The register request is missing the password in the data.attributes.password field"
      });
    });

    it('does not register a user when the supplied email address already exists in a user model in the backing store', async function () {
      await createUser('HASSAN@EXAMPLE.COM');

      let response = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': 'hassan@example.com',
            password: 'my secrets'
          }
        }
      });

      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: "User already exists with this email address"
      });
    });

    it('does not expose the password-hash to the user when registering user', async function () {
      let { body: { data: newUser } } = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': 'hassan@example.com',
            password: 'my secrets'
          }
        }
      });

      expect(newUser.attributes).to.not.have.property('password-hash');
    });
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

      let { data: user } = await searchers.getFromControllingBranch(env.session, type, id);
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
      user = (await searchers.getFromControllingBranch(env.session, type, id)).data;

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
      user = (await searchers.getFromControllingBranch(env.session, type, id)).data;

      expect(user).to.have.deep.property('attributes.email-address', 'vangogh@example.com');
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
      let { data: { attributes: { 'password-hash': hash } } } = await searchers.getFromControllingBranch(env.session, type, id);
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

      let { data: user } = await searchers.getFromControllingBranch(env.session, type, id);
      expect(hash).to.equal(user.attributes['password-hash']);
    });

    it('does not change password when new password is too short', async function () {
      let { token, user: { id, type } } = await createUser('hassan@example.com', 'password1');
      let { data: { attributes: { 'password-hash': hash } } } = await searchers.getFromControllingBranch(env.session, type, id);
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

      let { data: user } = await searchers.getFromControllingBranch(env.session, type, id);
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

      let { data: user } = await searchers.getFromControllingBranch(env.session, type, id);
      expect(user).to.have.deep.property('attributes.email-address', 'hassan@example.com');
    });
  });

  describe('authentication', function () {
    it('can authenticate a user that presents a valid email/password pair', async function () {
      let { user: { id, type } } = await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio`).send({
        email: 'hassan@example.com', password: 'password1'
      });

      expect(response).hasStatus(200);
      expect(response.body).has.deep.property('data.meta.token');
      expect(response.body).has.deep.property('data.meta.validUntil');
      expect(response.body).has.deep.property('data.id', id);
      expect(response.body).has.deep.property('data.type', type);
      expect(response.body).has.deep.property('data.attributes.name', 'Van Gogh');
      expect(response.body).has.deep.property('data.attributes.email-address', 'hassan@example.com');
      expect(response.body.data.attributes).to.not.have.property('password-hash');
    });

    it('does not authenticate a request that presents an invalid email/password pair', async function () {
      await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio`).send({
        email: 'hassan@example.com', password: 'bad password'
      });

      expect(response).hasStatus(401);
    });

    it('does not authenticate a request that specifies an email that doesnt exist in system', async function () {
      let response = await request.post(`/auth/portfolio`).send({
        email: 'does not exist', password: 'password'
      });

      expect(response).hasStatus(401);
    });

    it('does not authenticate a request that is missing an email', async function () {
      await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio`).send({
        email: '', password: 'password1'
      });

      expect(response).hasStatus(401);
    });

    it('does not authenticate a request that is missing a password', async function () {
      await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio`).send({
        email: 'hassan@example.com', password: ''
      });

      expect(response).hasStatus(401);
    });
  });
});
