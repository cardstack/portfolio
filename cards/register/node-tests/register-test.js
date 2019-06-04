const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const supertest = require('supertest');
const Koa = require('koa');
const { readdirSync, existsSync } = require('fs');
const { hashPassword, comparePassword } = require('portfolio-crypto');

const cardDir = join(__dirname, '../../');

let factory, env, searchers, request;

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

  return user;
}

describe('portfolio-register', function () {
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
    let app = new Koa();
    app.use(env.lookup('hub:middleware-stack').middleware());
    request = supertest(app.callback());
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
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

      let { data: users } = await searchers.search(env.session, {
        filter: { type: { exact: 'portfolio-users' } }
      })

      expect(users.length).to.equal(1);

      expect(users[0]).to.have.deep.property('attributes.email-address', 'hassan@example.com');
      expect(users[0]).to.have.deep.property('attributes.name', 'Hassan');
      expect(await comparePassword('my secrets', users[0].attributes['password-hash'])).to.equal(true);
    });

    it('creates a new portfolio instance and relates to newly created portfolio-user', async function() {
      await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': 'hassan@example.com',
            password: 'my secrets'
          }
        }
      });

      let { data: [ { id, type } ] } = await searchers.search(env.session, {
        filter: { type: { exact: 'portfolio-users' } }
      });

      let { data: portfolios } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'portfolios' },
          'user.id': { exact: id },
          'user.type': { exact: type }
        }
      });

      expect(portfolios.length).to.equal(1);
      expect(portfolios[0]).to.have.deep.property('attributes.title', 'My Cardfolio');
      expect(portfolios[0].relationships.wallets.data).to.eql([]);
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

    it('does not register a user when the password is less than 8 characters', async function () {
      let response = await request.post('/register').send({
        data: {
          type: 'portfolio-users',
          attributes: {
            name: 'Hassan',
            'email-address': 'hassan@example.com',
            password: '1234567'
          }
        }
      });
      expect(response).hasStatus(400);
      expect(response.body.errors).collectionContains({
        detail: "The password length must be at least 8 characters"
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

});
