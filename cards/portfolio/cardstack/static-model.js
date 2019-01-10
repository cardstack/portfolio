const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'portfolios')
  .withAttributes({
    defaultIncludes: [ 'wallets', 'user' ],
    fieldsets: {
      isolated: [
        { field: 'wallets', format: 'embedded' },
      ]
    }
  })
  .withRelated('fields', [
    factory.addResource('fields', 'title').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'wallets').withAttributes({
      fieldType: '@cardstack/core-types::has-many',
      editorComponent: 'field-editors/dropdown-multi-select-editor'
    }).withRelated('related-types', [{ type: 'content-types', id: 'wallets' }]),
    factory.addResource('fields', 'user').withAttributes({
      fieldType: '@cardstack/core-types::belongs-to',
    }).withRelated('related-types', [{ type: 'content-types', id: 'portfolio-users' }])
  ]);

  factory.addResource('grants', 'portfolio-self-read-grant')
    .withRelated('who', [{ type: 'fields', id: 'user' }])
    .withRelated('types', [
      { type: 'content-types', id: 'portfolios' },
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });

  factory.addResource('grants', 'portfolio-self-write-grant')
    .withRelated('who', [{ type: 'fields', id: 'user' }])
    .withRelated('types', [
      { type: 'content-types', id: 'portfolios' },
    ])
    .withRelated('fields', [
      // note that 'user' is not a self editable field
      { type: 'fields', id: 'title' },
      { type: 'fields', id: 'wallets' }
    ])
    .withAttributes({
      'may-update-resource': true,
      'may-write-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
