let models = [];
if (process.env.HUB_ENVIRONMENT === 'development' && !process.env.JSON_RPC_URL) {
  models = models.concat(require('../../../shared-data/mock-ethereum-data'));
}

module.exports = models;