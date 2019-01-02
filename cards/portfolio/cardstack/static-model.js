const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'portfolios')
  .withAttributes({
    defaultIncludes: [
      'wallets',
    ],
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
    })
      .withRelated('related-types', [{ type: 'content-types', id: 'wallets' }])
  ]);

let models = factory.getModels();
module.exports = function() { return models; };
