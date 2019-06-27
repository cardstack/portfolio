const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'portfolios')
  .withAttributes({
    defaultIncludes: [
      'wallets',
      'wallets.assets',
      'user',
      'todays-rates-lookup',
      'todays-rates-lookup.rates'
    ],
    fieldsets: {
      isolated: [
        { field: 'wallets', format: 'embedded' },
        { field: 'wallets.assets', format: 'embedded' },
        { field: 'todays-rates-lookup', format: 'embedded' },
        { field: 'todays-rates-lookup.rates', format: 'embedded' },
      ]
    }
  })
  .withRelated('fields', [
    { type: 'computed-fields', id: 'todays-rates-lookup' },

    factory.addResource('fields', 'title').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'wallets').withAttributes({
      fieldType: '@cardstack/core-types::has-many',
      // TODO need to create a custom field editor that adds a user relation to newly created wallets
      editorComponent: 'field-editors/dropdown-multi-select-editor'
    }).withRelated('related-types', [{ type: 'content-types', id: 'wallets' }]),
    factory.addResource('fields', 'user').withAttributes({
      fieldType: '@cardstack/core-types::belongs-to',
    }).withRelated('related-types', [{ type: 'content-types', id: 'portfolio-users' }]),
    factory.addResource('computed-fields', 'total-wallets-balance').withAttributes({
      computedFieldType: 'portfolio-portfolio::balance-sums',
    }),
    factory.addResource('computed-fields', 'balance-by-currency').withAttributes({
      computedFieldType: 'portfolio-portfolio::balance-by-currency',
    })
  ]);

  factory.addResource('grants', 'portfolio-global-grant')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [
      { type: 'content-types', id: 'portfolios' },
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
      'may-update-resource': true,
      'may-create-resource': true,
      'may-write-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
