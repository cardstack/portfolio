const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const cardDir = join(__dirname, '../../');

let factory, env, writers, searchers, sessions, user1, user2;

async function createWallet(user, attributes={}) {
  let { id, type } = user;
  let { data: wallet } = await writers.create('master', env.session, 'wallets', {
    data: {
      type: 'wallets',
      attributes,
      relationships: {
        user: { data: { type, id } }
      }
    }
  });
  return wallet;
}

describe('wallets', function () {
  beforeEach(async function () {
    factory = new JSONAPIFactory();

    // Make all content types available from the cards in our application available for us to use
    for (let cardName of readdirSync(cardDir)) {
      let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
      if (!existsSync(schemaFile)) { continue; }
      factory.importModels(require(schemaFile)());
    }

    user1 = factory.addResource('portfolio-users').withAttributes({
      'email-address': 'portfolio-user@example.com'
    });
    user2 = factory.addResource('portfolio-users').withAttributes({
      'email-address': 'another-portfolio-user@example.com'
    });

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    writers = env.lookup('hub:writers');
    sessions = env.lookup('hub:sessions');
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('grants', function () {
    it('allows user to view their wallet', async function () {
      let { id, type } = await createWallet(user1, { title: 'title' });
      let result = await searchers.getFromControllingBranch(sessions.create(user1.type, user1.id), type, id);
      let { data, included } = result;

      expect(data).to.have.deep.property('attributes.title', 'title');
      expect(data).to.have.deep.property('relationships.user.data.id', user1.id);
      expect(data).to.have.deep.property('relationships.user.data.type', user1.type);

      expect(included.length).to.be.greaterThan(0);
      let includedUsers = included.filter(i => i.type === user1.type);
      expect(includedUsers.length).to.equal(1);
      expect(includedUsers[0]).to.have.property('id', user1.id);
      expect(includedUsers[0]).to.have.deep.property('attributes.email-address', user1.data.attributes['email-address']);
    });

    it('does not allow users to view other users wallets', async function () {
      let { id, type } = await createWallet(user1, { title: 'title' });

      let error;
      try {
        await searchers.getFromControllingBranch(sessions.create(user2.type, user2.id), type, id);
      } catch (e) {
        error = e;
      }

      expect(error.status).to.equal(404);
    });

    it('allows a user to update their wallets attributes', async function() {
      let wallet = await createWallet(user1, { title: 'title' });
      let { id, type } = wallet;

      wallet.attributes.title = 'updated title';

      await writers.update('master', sessions.create(user1.type, user1.id), type, id, {
        data: wallet
      });

      let result = await searchers.getFromControllingBranch(env.session, type, id);
      expect(result).to.have.deep.property('data.attributes.title', 'updated title');
    });

    it('does not allow a user to update another user wallet', async function() {
      let wallet = await createWallet(user1, { title: 'title' });
      let { id, type } = wallet;

      wallet.attributes.title = 'updated title';

      let error;
      try {
        await writers.update('master', sessions.create(user2.type, user2.id), type, id, {
          data: wallet
        });
      } catch (e) {
        error = e;
      }

      expect(error.status).to.equal(404);
    });

    it('does not allow a user to change their wallet user relationship', async function() {
      let wallet = await createWallet(user1, { title: 'title' });
      let { id, type } = wallet;

      wallet.relationships.user.data = { type: user2.type, id: user2.id };

      let error;
      try {
        await writers.update('master', sessions.create(user1.type, user1.id), type, id, {
          data: wallet
        });
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);

      let result = await searchers.getFromControllingBranch(env.session, type, id);
      expect(result.data.relationships.user.data).to.eql({ type: user1.type, id: user1.id });
    });

    it('allows a user to create their wallet', async function() {
      let result = await writers.create('master', sessions.create(user1.type, user1.id), 'wallets', {
        data: {
          type: 'wallets',
          attributes: { title: 'title' },
          relationships: {
            user: { data: { type: user1.type, id: user1.id } }
          }
        }
      });
      let { data, included } = result;

      expect(data).to.have.deep.property('attributes.title', 'title');
      expect(data).to.have.deep.property('relationships.user.data.id', user1.id);
      expect(data).to.have.deep.property('relationships.user.data.type', user1.type);

      expect(included.length).to.be.greaterThan(0);
      let includedUsers = included.filter(i => i.type === user1.type);
      expect(includedUsers.length).to.equal(1);
      expect(includedUsers[0]).to.have.property('id', user1.id);
      expect(includedUsers[0]).to.have.deep.property('attributes.email-address', user1.data.attributes['email-address']);
    });

    it('does not allow a user to create someone elses wallet', async function() {
      let error;
      try {
        await writers.create('master', sessions.create(user1.type, user1.id), 'wallets', {
          data: {
            type: 'wallets',
            attributes: { title: 'title' },
            relationships: {
              user: { data: { type: user2.type, id: user2.id } }
            }
          }
        });
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('allows a user to delete a their wallet', async function() {
      let { id, type, meta: { version } } = await createWallet(user1, { title: 'title' });

      await writers.delete('master', sessions.create(user1.type, user1.id), version, type, id);

      let error;
      try {
        await searchers.getFromControllingBranch('master', env.session, type, id);
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not allow a user to delete a someone elses wallet', async function() {
      let { id, type, meta: { version } } = await createWallet(user1, { title: 'title' });

      let error;
      try {
        await writers.delete('master', sessions.create(user2.type, user2.id), version, type, id);
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(401);
    });

  });
});
