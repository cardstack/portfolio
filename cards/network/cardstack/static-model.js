const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'networks')
  .withRelated('fields', [
    factory.addResource('fields', 'title').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'unit').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'asset-type').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'address-field').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
  ]);

  factory.addResource('grants', 'network-grant')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [{ type: 'content-types', id: 'networks' }])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
