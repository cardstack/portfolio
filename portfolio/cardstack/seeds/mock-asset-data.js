let models = [];
if (process.env.HUB_ENVIRONMENT === 'development') {
  if (!process.env.JSON_RPC_URLS) {
    models = models.concat(require('../../../shared-data/mock-ethereum-data'));
  }
  models = models.concat(
    require('../../../shared-data/mock-bitcoin-data-1'),
    require('../../../shared-data/mock-bitcoin-data-2'),
    require('../../../shared-data/mock-litecoin-data-1'),
    require('../../../shared-data/mock-litecoin-data-2'),
    require('../../../shared-data/mock-zcash-data'),
  );
}

module.exports = models;