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
        },
        patch: {
          'content-types': {
            'ethereum-transactions': [{
              op: 'add',
              path: '/relationships/fields/data/-',
              value: { type: 'computed-fields', id: 'todays-rates' }
            },{
              op: 'add',
              path: '/attributes',
              value: {
                defaultIncludes: [ 'todays-rates' ],
                fieldsets: {
                  embedded: [
                    { field: 'todays-rates', format: 'embedded' },
                  ],
                  isolated: [
                    { field: 'todays-rates', format: 'embedded' },
                  ]
                }
              }
            }]
          }
        }
      }
    });
}

module.exports = factory.getModels();