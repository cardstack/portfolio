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
            'ethereum-addresses': [{
              op: 'add',
              path: '/attributes',
              value: {
                fieldsets: {
                  isolated: [
                    { field: 'transactions', format: 'embedded' },
                  ],
                  embedded: [
                    { field: 'transactions', format: 'embedded' },
                  ]
                }
              }
            }],
            'ethereum-transactions': [{
              op: 'add',
              path: '/relationships/fields/data/-',
              value: { type: 'computed-fields', id: 'rates-at-transaction-timestamp' }
            },{
              op: 'add',
              path: '/attributes',
              value: {
                defaultIncludes: [
                  'rates-at-transaction-timestamp',
                ],
                fieldsets: {
                  embedded: [
                    { field: 'rates-at-transaction-timestamp', format: 'embedded' },
                  ],
                  isolated: [
                    { field: 'rates-at-transaction-timestamp', format: 'embedded' },
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
