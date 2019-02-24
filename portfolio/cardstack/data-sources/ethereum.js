const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

if (process.env.JSON_RPC_URLS) {
  factory.addResource('data-sources', 'ethereum')
    .withAttributes({
      'source-type': '@cardstack/ethereum',
      params: {
        jsonRpcUrls: process.env.JSON_RPC_URLS.split(',').map(i => i.trim()),
        addressIndexing: {
          trackedAddressContentType: 'assets',
          trackedAddressField: 'ethereum-asset-id',
        },
        patch: {
          'content-types': {
            'ethereum-addresses': [{
              op: 'add',
              path: '/attributes',
              value: {
                defaultIncludes: [
                  'transactions',
                ],
                fieldsets: {
                  isolated: [
                    { field: 'transactions', format: 'embedded' },
                  ],
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
