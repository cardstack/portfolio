const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const { hashPassword } = require('portfolio-crypto');
const supertest = require('supertest');
const Koa = require('koa');
const cardDir = join(__dirname, '../');

let factory, env, searchers, sessions, request;

async function createUser(email, password="my secrets", name="Van Gogh") {
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
  return user;
}

describe('portfolio-users', function () {
  beforeEach(async function () {
    factory = new JSONAPIFactory();

    factory.addResource('data-sources', 'portfolio-user')
      .withAttributes({
        sourceType: 'portfolio-user',
      });

    let schemaFile = join(cardDir, 'cardstack', 'static-model.js');
    factory.importModels(require(schemaFile)());

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    sessions = env.lookup('hub:sessions');
    let app = new Koa();
    app.use(env.lookup('hub:middleware-stack').middleware());
    request = supertest(app.callback());
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('grants', function () {
    it('does not allow users to view other users', async function () {
      let hassan = await createUser('hassan@example.com');
      let vanGogh = await createUser('vangogh@example.com');
      let vanGoghSession = sessions.create(vanGogh.type, vanGogh.id);

      let error;
      try {
        await searchers.get(vanGoghSession, 'local-hub', hassan.type, hassan.id);
      } catch (e) {
        error = e;
      }

      expect(error.status).to.equal(404);
    });

    it('does not expose password-hash when getting a user', async function () {
      let { id, type } = await createUser('hassan@example.com', 'abc123');
      let session = sessions.create(type, id);
      let { data: self } = await searchers.get(session, 'local-hub', type, id);

      expect(self.attributes).to.not.have.property('password-hash');
    });
  });

  describe('authentication', function () {
    it('can authenticate a user that presents a valid email/password pair', async function () {
      let { id, type } = await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio-user`).send({
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
      let response = await request.post(`/auth/portfolio-user`).send({
        email: 'hassan@example.com', password: 'bad password'
      });

      expect(response).hasStatus(401);
    });

    it('does not authenticate a request that specifies an email that doesnt exist in system', async function () {
      let response = await request.post(`/auth/portfolio-user`).send({
        email: 'does not exist', password: 'password'
      });

      expect(response).hasStatus(401);
    });

    it('does not authenticate a request that is missing an email', async function () {
      await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio-user`).send({
        email: '', password: 'password1'
      });

      expect(response).hasStatus(401);
    });

    it('does not authenticate a request that is missing a password', async function () {
      await createUser('hassan@example.com', 'password1');
      let response = await request.post(`/auth/portfolio-user`).send({
        email: 'hassan@example.com', password: ''
      });

      expect(response).hasStatus(401);
    });
  });
});
