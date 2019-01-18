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

factory.addResource('computed-fields', 'todays-rates-lookup').withAttributes({
  'computed-field-type': 'portfolio-crypto-compare::todays-rates'
}).withRelated('related-types', [
  factory.addResource('content-types', 'crypto-compare-current-rates')
    .withAttributes({ defaultIncludes: ['rates'] })
    .withRelated('fields', [
      factory.addResource('fields', 'rates').withAttributes({
        fieldType: '@cardstack/core-types::has-many'
      }).withRelated('related-types', [{ type: 'content-types', id: 'crypto-compares' }])
    ])
]);

factory.addResource('grants', 'crypto-compare-grant')
  .withRelated('who', [{ type: 'groups', id: 'everyone' }])
  .withRelated('types', [
    { type: 'content-types', id: 'crypto-compares' },
    { type: 'content-types', id: 'crypto-compare-current-rates' }
  ])
  .withAttributes({
    'may-read-resource': true,
    'may-read-fields': true,
  });

let models = factory.getModels();
module.exports = function () { return models; };
