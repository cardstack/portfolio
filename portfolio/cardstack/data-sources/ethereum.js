const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.JSON_RPC_URL) {
  factory.addResource('data-sources', 'ethereum')
    .withAttributes({
      'source-type': '@cardstack/ethereum',
      params: {
        jsonRpcUrl: process.env.JSON_RPC_URL,
        addressIndexing: {
          trackedAddressContentType: 'assets',
          trackedAddressField: 'ethereum-asset-id',
          maxBlockSearchDepth: 50000
        }
      }
    });
}

module.exports = factory.getModels();