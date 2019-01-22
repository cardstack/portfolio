const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();

// TODO create router for assets card so that we can use a custom error page that doens't have a login template
factory.addResource('content-types', 'assets')
  .withAttributes({
    defaultIncludes: [
      'asset-history',
      'transactions',
      'todays-rates-lookup',
      'todays-rates-lookup.rates',
      'network',
      'network-asset',
      'network-asset.transactions'
    ],
    fieldsets: {
      isolated: [
        { field: 'transactions', format: 'embedded' },
        { field: 'network', format: 'embedded' },
        { field: 'todays-rates-lookup', format: 'embedded' },
        { field: 'todays-rates-lookup.rates', format: 'embedded' },
        { field: 'network-asset', format: 'isolated' }, // we want to load this as isolated, as this card is essentially a wrapper for the network asset
        { field: 'network-asset.transactions', format: 'embedded' },
        { field: 'asset-history', format: 'embedded' },
      ],
      embedded: [
        { field: 'network', format: 'embedded' },
        { field: 'network-asset', format: 'embedded' },
        { field: 'todays-rates-lookup', format: 'embedded' },
        { field: 'todays-rates-lookup.rates', format: 'embedded' },
      ]
    }
  })
  .withRelated('fields', [
    { type: 'computed-fields', id: 'todays-rates-lookup' },

    // TODO use default on create for relationship to ethereum network?
    factory.addResource('fields', 'network').withAttributes({
      fieldType: '@cardstack/core-types::belongs-to'
    })
    .withRelated('related-types', [{ type: 'content-types', id: 'networks' }]),
    factory.addResource('computed-fields', 'formatted-address').withAttributes({
      'computed-field-type': 'portfolio-asset::formatted-address',
    }),
    factory.addResource('computed-fields', 'network-title').withAttributes({
      'computed-field-type': '@cardstack/core-types::alias',
      params: { aliasPath: 'network.title' }
    }),
    factory.addResource('computed-fields', 'network-id').withAttributes({
      'computed-field-type': '@cardstack/core-types::alias',
      params: { aliasPath: 'network.id' }
    }),
    factory.addResource('computed-fields', 'network-unit').withAttributes({
      'computed-field-type': '@cardstack/core-types::alias',
      params: { aliasPath: 'network.unit' }
    }),
    factory.addResource('computed-fields', 'network-asset').withAttributes({
      'computed-field-type': 'portfolio-asset::network-asset',
    }),
    factory.addResource('computed-fields', 'asset-history').withAttributes({
      'computed-field-type': '@cardstack/core-types::correlate-by-field',
      params: {
        relationshipType: 'asset-histories',
        field: 'id',
        toLowerCase: true
      }
    }),
    factory.addResource('computed-fields', 'ethereum-asset-id').withAttributes({
      'computed-field-type': 'portfolio-asset::network-address',
      params: { networkId: 'ether' }
    }),
    factory.addResource('computed-fields', 'is-loading-asset').withAttributes({
      'computed-field-type': 'portfolio-asset::loading-asset'
    }),
    factory.addResource('computed-fields', 'last-transaction-timestamp').withAttributes({
      'computed-field-type': 'portfolio-asset::last-transaction-timestamp',
    }),
    factory.addResource('computed-fields', 'first-transaction-timestamp').withAttributes({
      'computed-field-type': 'portfolio-asset::first-transaction-timestamp',
    }),

    // For the future when we have a bitcoin indexer....
    factory.addResource('computed-fields', 'bitcoin-asset-id').withAttributes({
      'computed-field-type': 'portfolio-asset::network-address',
      params: { networkId: 'bitcoin' }
    })
  ]);

  factory.addResource('groups', 'portfolio-users')
    .withAttributes({
      'search-query': {
        filter: { type: { exact: 'portfolio-users' } }
      }
    });

  factory.addResource('grants', 'asset-anonymous-read')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [
      { type: 'content-types', id: 'assets' },
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });

  factory.addResource('grants', 'asset-authenticated-create')
    .withRelated('who', [{ type: 'groups', id: 'portfolio-users' }])
    .withRelated('types', [
      { type: 'content-types', id: 'assets' },
    ])
    .withAttributes({
      'may-create-resource': true,
      'may-write-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
