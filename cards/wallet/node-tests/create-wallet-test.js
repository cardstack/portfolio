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

describe('create wallet', function () {
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

      factory.addResource(`${symbol}-token-balance-ofs`, tokenAddress.toLowerCase()).withAttributes({
          "ethereum-address": tokenAddress,
          "mapping-number-value": "53824000000000000000"
        });
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

    factory.addResource('networks', 'dai')
      .withAttributes({
        title: 'DAI Token',
        unit: 'DAI',
        'asset-type': 'dai-token-balance-ofs'
      });

    factory.addResource('wallets', '0x12345');

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
    let app = new Koa();
    app.use(env.lookup('hub:middleware-stack').middleware());
    request = supertest(app.callback());
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('/create-wallet/:address', function () {
    it('supports CORS preflight for token-assets endpoint', async function () {
      let response = await request.options(`/create-wallet/${tokenAddress}`);
      expect(response).hasStatus(200);
      expect(response.headers['access-control-allow-methods']).matches(/POST/);
    });

    it('create wallet and assets', async function () {
      let response = await request.post(`/create-wallet/${tokenAddress}`).send({});

      expect(response).hasStatus(200);
      expect(response.body.data.id).is.equal(tokenAddress);
      expect(response.body.data.relationships.assets.data).has.length(4);

      let { data: wallet } = await searchers.get(env.session, 'local-hub', 'wallets', tokenAddress);

      expect(wallet.id).to.equal(tokenAddress);

      let walletAssetIds = wallet.relationships.assets.data.map(asset => asset.id);
      expect(walletAssetIds).to.eql(['0xAbCdE', '0xAbCdE_card-token', '0xAbCdE_dai-token', '0xAbCdE_usdt-token']);
    });

    it('does not create a wallet that already exists', async function () {
      let response = await request.post('/create-wallet/0x12345').send({});

      expect(response).hasStatus(409);
      expect(response.body.errors).collectionContains({
        detail: "Wallet with ID 0x12345 exists"
      });
    });
  });
});
