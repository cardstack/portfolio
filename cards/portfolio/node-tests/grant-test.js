const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const cardDir = join(__dirname, '../../');

let factory, env, writers, searchers, sessions, user1;

async function createPortfolio(user, attributes={}) {
  let { id, type } = user;
  let { data: portfolio } = await writers.create(env.session, 'portfolios', {
    data: {
      type: 'portfolios',
      attributes,
      relationships: {
        wallets: { data: [] },
        user: { data: { type, id } }
      }
    }
  });
  return portfolio;
}

describe('portfolios', function () {
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

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    writers = env.lookup('hub:writers');
    sessions = env.lookup('hub:sessions');
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('grants', function () {
    it('allows user to view their portfolio', async function () {
      let { id, type } = await createPortfolio(user1, { title: 'title' });
      let result = await searchers.get(sessions.create(user1.type, user1.id), 'local-hub', type, id);
      let { data, included } = result;

      expect(data).to.have.deep.property('attributes.title', 'title');
      expect(data).to.have.deep.property('relationships.user.data.id', user1.id);
      expect(data).to.have.deep.property('relationships.user.data.type', user1.type);
      expect(data.relationships.wallets.data).to.eql([]);

      expect(included.length).to.equal(1);
      expect(included[0]).to.have.property('id', user1.id);
      expect(included[0]).to.have.property('type', user1.type);
      expect(included[0]).to.have.deep.property('attributes.email-address', user1.data.attributes['email-address']);
    });

    it('allows a user to update their portfolio`s title and wallets fields', async function() {
      let portfolio = await createPortfolio(user1, { title: 'title' });
      let { id, type } = portfolio;
      let { data: wallet } = await writers.create(env.session, 'wallets', {
        data: { type: 'wallets' }
      });

      portfolio.attributes.title = 'updated title';
      portfolio.relationships.wallets.data = [ { type: wallet.type, id: wallet.id }];

      await writers.update(sessions.create(user1.type, user1.id), type, id, {
        data: portfolio
      });

      let result = await searchers.get(env.session, 'local-hub', type, id);
      expect(result).to.have.deep.property('data.attributes.title', 'updated title');
      expect(result.data.relationships.wallets.data).to.eql([ { type: wallet.type, id: wallet.id }]);
    });

    it('does not allow a user to delete a their portfolio', async function() {
      let { id, type, meta: { version } } = await createPortfolio(user1, { title: 'title' });

      let error;
      try {
        await writers.delete(sessions.create(user1.type, user1.id), version, type, id);
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(401);
    });

  });
});
