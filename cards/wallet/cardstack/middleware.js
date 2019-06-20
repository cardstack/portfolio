const { declareInjections } = require('@cardstack/di');
const Error = require('@cardstack/plugin-utils/error');
const Session = require('@cardstack/plugin-utils/session');
const compose = require('koa-compose');
const route = require('koa-better-route');
const koaJSONBody = require('koa-json-body');
const { erc20Tokens } = require('portfolio-utils');

const { withJsonErrorHandling } = Error;
const prefix = 'create-wallet';

function addCorsHeaders(response) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = declareInjections({
  writers: 'hub:writers',
  searchers: 'hub:searchers',
},

  class PortfolioWalletCreate {
    get after() {
      return 'authentication';
    }

    middleware() {
      return compose([
        this._createWalletPreflight(),
        this._createWallet(),
      ]);
    }

    _createWalletPreflight() {
      return route.options(`/${prefix}/:address`, async (ctxt) => {
        addCorsHeaders(ctxt.response);
        ctxt.status = 200;
      });
    }

    _createWallet() {
      return route.post(`/${prefix}/:address`, compose([
        koaJSONBody({ limit: '1mb' }),
        async (ctxt) => {
          addCorsHeaders(ctxt.response);
          await withJsonErrorHandling(ctxt, async () => {
            let address = ctxt.routeParams.address;

            let { data: existingWallets } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
              filter: {
                type: { exact: 'wallets' },
                id: { exact: address }
              }
            });

            // check if wallet already exists
            if (existingWallets.length) {
              let existingWalletId = existingWallets[0].id;
              ctxt.status = 409;
              ctxt.body = {
                errors: [{
                  title: "Wallet Exists",
                  detail: `Wallet with ID ${existingWalletId} exists`
                }]
              };
              return;
            }


            // create ether asset
            await this.writers.create(Session.INTERNAL_PRIVILEGED, 'assets', {
              data: {
                type: 'assets',
                id: address,
                relationships: {
                  network: { data: { type: 'networks', id: 'ether' } }
                }
              }
            });

            let assetData = [{ type: 'assets', id: address }];

            // see which tokens are associated with this address
            let balanceOfIds = erc20Tokens.map(token => `${token.symbol.toLowerCase()}-token-balance-ofs`);
            let { data: tokenBalanceOfs } = await this.searchers.search(Session.INTERNAL_PRIVILEGED, {
              filter: {
                type: { exact: balanceOfIds },
                id: { exact: address.toLowerCase() }
              }
            });

            // create token assets
            let tokenNames = tokenBalanceOfs.map(balance => balance.type.split('-')[0]);
            for (let tokenName of tokenNames) {
              let id = `${address}_${tokenName}-token`;

              await this.writers.create(Session.INTERNAL_PRIVILEGED, 'assets', {
                data: {
                  type: 'assets',
                  id,
                  relationships: {
                    network: { data: { type: 'networks', id: tokenName } }
                  }
                }
              });

              assetData.push({ type: 'assets', id });
            }

            // create wallet
            await this.writers.create(Session.INTERNAL_PRIVILEGED, 'wallets', {
              data: {
                type: 'wallets',
                id: address,
                attributes: {
                  title: 'Metamask Wallet'
                },
                relationships: {
                  assets: { data: assetData }
                }
              }
            });

            let savedWallet = await this.searchers.get(Session.INTERNAL_PRIVILEGED, 'local-hub', 'wallets', address);

            ctxt.status = 200;
            ctxt.body = savedWallet;
          });
        }
      ]));
    }
  }
);