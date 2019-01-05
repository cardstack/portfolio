const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'wallets')
  .withAttributes({
    defaultIncludes: [
      'assets',
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
    })
      .withRelated('related-types', [{ type: 'content-types', id: 'assets' }])
  ]);

let models = factory.getModels();
module.exports = function() { return models; };
