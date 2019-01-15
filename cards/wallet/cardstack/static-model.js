const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'wallets')
  .withAttributes({
    defaultIncludes: [
      'assets', 'user',
    ],
    fieldsets: {
      embedded: [
        { field: 'assets', format: 'embedded' },
      ],
      isolated: [
        { field: 'assets', format: 'embedded' },
      ]
    }
  })
  .withRelated('fields', [
    factory.addResource('fields', 'title').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'logo').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'assets').withAttributes({
      fieldType: '@cardstack/core-types::has-many',
      editorComponent: 'field-editors/dropdown-multi-select-editor'
    }).withRelated('related-types', [{ type: 'content-types', id: 'assets' }]),
    factory.addResource('fields', 'user').withAttributes({
      fieldType: '@cardstack/core-types::belongs-to',
    }).withRelated('related-types', [{ type: 'content-types', id: 'portfolio-users' }])
  ]);

  factory.addResource('grants', 'wallet-self-grant')
    .withRelated('who', [{ type: 'fields', id: 'user' }])
    .withRelated('types', [
      { type: 'content-types', id: 'wallets' },
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
      'may-create-resource': true,
      'may-update-resource': true,
      'may-delete-resource': true,
      'may-write-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
