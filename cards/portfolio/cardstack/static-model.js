const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'portfolios')
  .withAttributes({
    defaultIncludes: [
      'wallets',
      'wallets.assets',
      'user',
      'todays-rates-lookup.rates'
    ],
    fieldsets: {
      isolated: [
        { field: 'wallets', format: 'embedded' },
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
  ]);

  factory.addResource('grants', 'portfolio-self-grant')
    .withRelated('who', [{ type: 'fields', id: 'user' }])
    .withRelated('types', [
      { type: 'content-types', id: 'portfolios' },
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
      'may-update-resource': true,
      'may-write-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
