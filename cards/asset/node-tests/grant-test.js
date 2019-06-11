const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const cardDir = join(__dirname, '../../');

let factory, env, writers, searchers, sessions, user, network;

async function createAsset(attributes={}) {
  let { data: asset } = await writers.create(env.session, 'assets', {
    data: {
      type: 'assets',
      attributes,
      relationships: {
        network: { data: { type: 'networks', id: 'ether' } }
      }
    }
  });
  return asset;
}

describe('assets', function () {
  beforeEach(async function () {
    factory = new JSONAPIFactory();

    // Make all content types available from the cards in our application available for us to use
    for (let cardName of readdirSync(cardDir)) {
      let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
      if (!existsSync(schemaFile)) { continue; }
      factory.importModels(require(schemaFile)());
    }

    factory.addResource('content-types', 'ethereum-addresses');

    network = factory.addResource('networks', 'ether')
      .withAttributes({
        title: 'Ether',
        unit: 'ETH',
        'asset-type': 'ethereum-addresses'
      });

    factory.addResource('networks', 'bitcoin')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC',
      });

    factory.addResource('data-sources', 'asset-history')
      .withAttributes({
        sourceType: 'portfolio-asset-history',
        params: {
          assetContentTypes: ['ethereum-addresses'],
          transactionContentTypes: ['ethereum-transactions'],
          maxAssetHistories: 100,
        }
      });

    user = factory.addResource('portfolio-users').withAttributes({
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
    it('allows anonymous read of an asset', async function () {
      let { id, type } = await createAsset();

      let result = await searchers.get(null, 'local-hub', type, id);
      let { data, included } = result;

      expect(data).to.have.deep.property('relationships.network.data.id', network.id);
      expect(data).to.have.deep.property('relationships.network.data.type', network.type);

      expect(included.length).to.equal(1);
      expect(included[0]).to.have.property('id', network.id);
      expect(included[0]).to.have.property('type', network.type);
    });

    it('does not allow anonymous create of an asset', async function () {
      let error;
      try {
        await writers.create(null, 'assets', {
          data: {
            type: 'assets',
            relationships: {
              network: { data: { type: 'networks', id: 'ether' } }
            }
          }
        });
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(401);
    });

    it('allows a user to create an asset', async function () {
      let { data, included } = await writers.create(sessions.create(user.type, user.id), 'assets', {
        data: {
          type: 'assets',
          relationships: {
            network: { data: { type: 'networks', id: 'ether' } }
          }
        }
      });
      expect(data).to.have.deep.property('relationships.network.data.id', network.id);
      expect(data).to.have.deep.property('relationships.network.data.type', network.type);

      expect(included.length).to.equal(1);
      expect(included[0]).to.have.property('id', network.id);
      expect(included[0]).to.have.property('type', network.type);
    });

    it('does not allow a user to update the asset', async function () {
      let asset = await createAsset();
      let { id, type } = asset;

      asset.relationships.network.data.id = 'bitcoin';

      let error;
      try {
        await writers.update(sessions.create(user.type, user.id), type, id, {
          data: asset
        });
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(401);
    });

    it('does not allow a user to delete the asset', async function () {
      let { id, type, meta: { version } } = await createAsset();

      let error;
      try {
        await writers.delete(sessions.create(user.type, user.id), version, type, id);
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(401);
    });

  });
});
