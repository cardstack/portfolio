const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const supertest = require('supertest');
const Koa = require('koa');

const cardDir = join(__dirname, '../../');

let factory, env, searchers, request;

const tokenAddress = '0xAbCdE';

describe('create token assets', function () {
  beforeEach(async function () {
    factory = new JSONAPIFactory();

    // Make all content types available from the cards in our application aviailable for us to use
    for (let cardName of readdirSync(cardDir)) {
      let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
      if (!existsSync(schemaFile)) { continue; }
      factory.importModels(require(schemaFile)());
    }

    factory.addResource('content-types', 'asset-histories');

    ['card', 'usdt', 'dai'].forEach(symbol => {
      factory.addResource('content-types', `${symbol}-token-balance-ofs`)
        .withRelated('fields', [
          factory.addResource('fields', 'ethereum-address').withAttributes({ fieldType: '@cardstack/core-types::string' }),
          factory.addResource('fields', 'mapping-number-value').withAttributes({ fieldType: '@cardstack/core-types::string' })
        ]);
    })

    factory.addResource('networks', 'card')
      .withAttributes({
        title: 'Cardstack Token',
        unit: 'CARD',
        'asset-type': 'card-token-balance-ofs'
      });

    factory.addResource('networks', 'usdt')
      .withAttributes({
        title: 'USDT Token',
        unit: 'USDT',
        'asset-type': 'usdt-token-balance-ofs'
      });

    let daiNetwork = factory.addResource('networks', 'dai')
      .withAttributes({
        title: 'DAI Token',
        unit: 'DAI',
        'asset-type': 'dai-token-balance-ofs'
      });

    factory.addResource('card-token-balance-ofs', tokenAddress).withAttributes({
        "ethereum-address": tokenAddress,
        "mapping-number-value": "53824000000000000000"
      });
    factory.addResource('usdt-token-balance-ofs', tokenAddress).withAttributes({
        "ethereum-address": tokenAddress,
        "mapping-number-value": "118544000000000000000"
      });
    factory.addResource('dai-token-balance-ofs', tokenAddress).withAttributes({
        "ethereum-address": tokenAddress,
        "mapping-number-value": "837465000000000000000"
      });

    factory.addResource('assets', `${tokenAddress}_dai-token`)
      .withRelated('network', daiNetwork);

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    let app = new Koa();
    app.use(env.lookup('hub:middleware-stack').middleware());
    request = supertest(app.callback());
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('/token-assets', function () {
    it('supports CORS preflight for token-assets endpoint', async function () {
      let response = await request.options('/token-assets');
      expect(response).hasStatus(200);
      expect(response.headers['access-control-allow-methods']).matches(/POST/);
    });

    it('create assets for tokens', async function () {
      let response = await request.post('/token-assets').send({
        data: [
          {
            type: 'assets',
            id: `${tokenAddress}_card-token`,
            relationships: {
              network: { data: { type: 'networks', id: 'card' } }

            }
          },
          {
            type: 'assets',
            id: `${tokenAddress}_usdt-token`,
            relationships: {
              network: { data: { type: 'networks', id: 'usdt' } }
            }
          }
        ]
      });

      expect(response).hasStatus(200);
      expect(response.body.data).has.length(2);

      let { data: assets } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'assets' },
          id: [`${tokenAddress}_card-token`, `${tokenAddress}_usdt-token`]
        }
      });

      expect(assets.length).to.equal(2);
      expect(assets[0].id).to.equal(`${tokenAddress}_card-token`);
      expect(assets[0].attributes['network-title']).to.equal('Cardstack Token');
      expect(assets[1].id).to.equal(`${tokenAddress}_usdt-token`);
      expect(assets[1].attributes['network-title']).to.equal('USDT Token');
    });

    it('does not create an asset that already exists', async function () {
      let response = await request.post('/token-assets').send({
        data: [
          {
            type: 'assets',
            id: `${tokenAddress}_dai-token`,
            relationships: {
              network: { data: { type: 'networks', id: 'dai' } }
            }
          }
        ]
      });

      expect(response).hasStatus(409);
      expect(response.body.errors).collectionContains({
        detail: "Assets with ids 0xAbCdE_dai-token exist"
      });

      let { data: assets } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'assets' }
        }
      });

      expect(assets.length).to.equal(1);
      expect(assets[0].id).to.equal(`${tokenAddress}_dai-token`);
      expect(assets[0].attributes['network-title']).to.equal('DAI Token');
    });

    it('returns 409 if any asset in request body already exists', async function () {
      let response = await request.post('/token-assets').send({
        data: [
          {
            type: 'assets',
            id: `${tokenAddress}_usdt-token`,
            relationships: {
              network: { data: { type: 'networks', id: 'usdt' } }
            }
          },
          {
            type: 'assets',
            id: `${tokenAddress}_dai-token`,
            relationships: {
              network: { data: { type: 'networks', id: 'dai' } }
            }
          }
        ]
      });

      expect(response).hasStatus(409);
      expect(response.body.errors).collectionContains({
        detail: "Assets with ids 0xAbCdE_dai-token exist"
      });


      let { data: assets } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'assets' }
        }
      });

      expect(assets.length).to.equal(1);
      expect(assets[0].id).to.equal(`${tokenAddress}_dai-token`);
      expect(assets[0].attributes['network-title']).to.equal('DAI Token');
    });
  });
});
