const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'assets')
  .withAttributes({
    defaultIncludes: [
      'transactions',
    ],
    fieldsets: {
      isolated: [
        { field: 'transactions', format: 'embedded' },
      ]
    }
  })
  .withRelated('fields', [
    factory.addResource('fields', 'title').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'unit').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'logo').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'transactions').withAttributes({
      fieldType: '@cardstack/core-types::has-many'
    })
      .withRelated('related-types', [{ type: 'content-types', id: 'transactions' }]),
  ]);

let models = factory.getModels();
module.exports = function() { return models; };
