const { declareInjections } = require('@cardstack/di');
const Error = require('@cardstack/plugin-utils/error');
const Session = require('@cardstack/plugin-utils/session');
const compose = require('koa-compose');
const route = require('koa-better-route');
const koaJSONBody = require('koa-json-body');
const { get } = require('lodash');

const { withJsonErrorHandling } = Error;
const prefix = 'token-assets';

function addCorsHeaders(response) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = declareInjections({
  writers: 'hub:writers',
  searchers: 'hub:searchers',
},

  class PortfolioProfileUpdate {
    get after() {
      return 'authentication';
    }

    middleware() {
      return compose([
        this._createTokenAssetsPreflight(),
        this._createTokenAssets(),
      ]);
    }

    _createTokenAssetsPreflight() {
      return route.options(`/${prefix}`, async (ctxt) => {
        addCorsHeaders(ctxt.response);
        ctxt.status = 200;
      });
    }

    _createTokenAssets() {
      return route.post(`/${prefix}`, compose([
        koaJSONBody({ limit: '1mb' }),
        async (ctxt) => {
          addCorsHeaders(ctxt.response);
          await withJsonErrorHandling(ctxt, async () => {
            let assets = get(ctxt, 'request.body.data');
            let assetIds = assets.map(asset => asset.id);

            let { data: existingAssets } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
              filter: {
                type: { exact: 'assets' },
                id: { exact: assetIds }
              }
            });

            if (existingAssets.length) {
              let existingAssetIds = existingAssets.map(asset => asset.id);
              ctxt.status = 409;
              ctxt.body = {
                errors: [{
                  title: "Assets Exist",
                  detail: `Assets with ids ${existingAssetIds.join(', ')} exist`
                }]
              };
              return;
            }

            for (let asset of assets) {
              let { type, id } = asset.relationships.network.data;
              await this.writers.create(Session.INTERNAL_PRIVILEGED, 'assets', {
                data: {
                  type: 'assets',
                  id: asset.id,
                  relationships: {
                    network: { data: { type, id } }
                  }
                }
              });
            }

            let savedAssets = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
              filter: {
                type: { exact: 'assets' },
                id: { exact: assetIds }
              }
            });

            ctxt.status = 200;
            ctxt.body = savedAssets;
          });
        }
      ]));
    }
  }
);