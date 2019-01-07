const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const cardDir = join(__dirname, '../../cards');
const portfolioRouter = require('./router');
const defaultRouter = require('@cardstack/routing/cardstack/default-router');

module.exports = function () {
  let factory = new JSONAPIFactory();
  let cardSchemas = new JSONAPIFactory();

  for (let cardName of readdirSync(cardDir)) {
    let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
    if (existsSync(schemaFile)) {
      cardSchemas.importModels(require(schemaFile)());
      factory.addResource('data-sources')
        .withAttributes({ sourceType: `portfolio-${cardName}` });
    }
  }

  // TODO update this to mock a 'portfolio-users' model
  // probably also wanna seed with a user that has a matching preset password
  // when process.env.HUB_ENVIRONMENT === 'development'
  // (note that tests declare mock-auth data sources explicitly in their fixtures)
  factory.addResource('data-sources', 'mock-auth')
    .withAttributes({
      sourceType: '@cardstack/mock-auth',
      'user-rewriter': './cardstack/mock-auth-rewriter.js',
      params: {
        provideUserSchema: false,
        mockedTypes: ['mock-users'],
        users: {
          'mock-user': {
            type: 'mock-users',
            id: 'mock-user',
            attributes: {
              name: "Mock User",
              'email': 'hassan.abdelrahman@gmail.com',
              'avatar-url': "https://avatars2.githubusercontent.com/u/61075?v=4",
            },
          },
        }
      }
    });

  factory.addResource('content-types', 'mock-users')
    .withRelated('fields', [
      factory.addResource('fields', 'name').withAttributes({
        fieldType: '@cardstack/core-types::string'
      }),
      factory.addResource('fields', 'email').withAttributes({
        fieldType: '@cardstack/core-types::string'
      }),
      factory.addResource('fields', 'avatar-url').withAttributes({
        fieldType: '@cardstack/core-types::string'
      }),
    ]);

  factory.addResource('grants', 'mock-user-login-grant')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [{ type: 'content-types', id: 'mock-users' }])
    .withAttributes({
      'may-login': true,
    });

  let router = process.env.HUB_ENVIRONMENT === 'test' &&
               process.env.TEST &&
               process.env.TEST.includes('cards/') ? defaultRouter : portfolioRouter;
  factory.addResource('content-types', 'app-cards')
    .withAttributes({ router });
  factory.addResource('app-cards', 'portfolio');

  factory.addResource('grants', 'app-card-grant')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [{ type: 'content-types', id: 'app-cards' }])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });

  factory.addResource('grants')
    // TODO we need to lock these down to self CRUD, and add tests...
    // .withRelated('who', [{ type: 'fields', id: 'id' }])
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [
      { type: 'content-types', id: 'portfolios' },
      { type: 'content-types', id: 'wallets' },
      { type: 'content-types', id: 'assets' },
      { type: 'content-types', id: 'transactions' }
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
      'may-create-resource': true,
      'may-update-resource': true,
      'may-delete-resource': true,
      'may-write-fields': true,
    });

  return factory.getModels();
};
