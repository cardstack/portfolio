const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'crypto-compares')
  .withRelated('fields', [
    factory.addResource('fields', 'from-crypto-currency').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'to-fiat-currency').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'cents').withAttributes({
      fieldType: '@cardstack/core-types::integer'
    }),
    factory.addResource('fields', 'gmt-date').withAttributes({
      fieldType: '@cardstack/core-types::string'
    })
  ]);

  factory.addResource('grants', 'crypto-compare-grant')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [{ type: 'content-types', id: 'crypto-compares' }])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });

let models = factory.getModels();
module.exports = function() { return models; };
