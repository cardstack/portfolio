const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const mockEthereumSchema = require('../../../shared-data/mock-ethereum-schema');

let factory = new JSONAPIFactory();

factory.addResource('grants', 'asset-history-read')
  .withRelated('who', [{ type: 'groups', id: 'everyone' }])
  .withRelated('types', [
    { type: 'content-types', id: 'asset-histories' },
    { type: 'content-types', id: 'asset-history-values' },
  ])
  .withAttributes({
    'may-read-resource': true,
    'may-read-fields': true,
  });

let models = factory.getModels();
if (!process.env.JSON_RPC_URLS) {
  models = mockEthereumSchema.concat(models);
}
module.exports = function () { return models; };
