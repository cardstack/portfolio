const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'portfolio-users')
  .withRelated('fields', [
    factory.addResource('fields', 'email-address').withAttributes({
      fieldType: '@cardstack/core-types::case-insensitive'
    }),
    factory.addResource('fields', 'password-hash').withAttributes({
      editorOptions: { hideFromEditor: true },
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'name').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
    factory.addResource('fields', 'avatar-url').withAttributes({
      fieldType: '@cardstack/core-types::string'
    }),
  ]);

factory.addResource('content-types', 'app-cards-errors');
factory.addResource('app-cards-errors', 'not-found');

factory.addResource('grants', 'app-cards-errors-grant')
.withAttributes({
  'may-read-fields': true,
  'may-read-resource': true
})
.withRelated('who', [{ type: 'groups', id: 'everyone' }])
.withRelated('types', [{ type: 'content-types', id: 'app-cards-errors' }]);

factory.addResource('grants', 'portfolio-users-self-read-grant')
  .withRelated('who', [{ type: 'fields', id: 'id' }])
  .withRelated('types', [{ type: 'content-types', id: 'portfolio-users' }])
  .withRelated('fields', [
    { type: 'fields', id: 'name' },
    { type: 'fields', id: 'email-address' },
    { type: 'fields', id: 'avatar-url' }
  ])
  .withAttributes({
    'may-read-resource': true,
    'may-read-fields': true,
  });

factory.addResource('grants', 'portfolio-users-login-grant')
  .withRelated('who', [{ type: 'groups', id: 'everyone' }])
  .withRelated('types', [{ type: 'content-types', id: 'portfolio-users' }])
  .withAttributes({
    'may-login': true,
  });

let models = factory.getModels();
module.exports = function () { return models; };
