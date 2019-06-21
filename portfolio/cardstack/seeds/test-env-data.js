
const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'test') {
  factory.addResource('content-types', 'card-token-balance-ofs')
    .withRelated('fields', [
      factory.addResource('fields', 'ethereum-address').withAttributes({
        fieldType: '@cardstack/core-types::string'
      }),
      factory.addResource('fields', 'mapping-number-value').withAttributes({
        fieldType: '@cardstack/core-types::string'
      })
    ]);

  factory.addResource('grants', 'world-read')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [
      { type: 'content-types', id: 'card-token-balance-ofs' },
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });
}

module.exports = factory.getModels();
