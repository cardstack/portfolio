const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
// const { readdirSync, existsSync } = require('fs');
// const { join } = require('path');
// const cardDir = join(__dirname, '../../cards');
const portfolioRouter = require('./router');
const defaultRouter = require('@cardstack/routing/cardstack/default-router');

module.exports = function () {
  let factory = new JSONAPIFactory();
  // let cardSchemas = new JSONAPIFactory();

  /* TODO add this after we've added some cards
  for (let cardName of readdirSync(cardDir)) {
    let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
    if (existsSync(schemaFile)) {
      cardSchemas.importModels(require(schemaFile)());
      factory.addResource('data-sources')
        .withAttributes({ sourceType: `portfolio-${cardName}` });
    }
  }
  */

  // TODO probably only want to use this in the HUB_ENVIRONMENT == development env
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

  let router = process.env.HUB_ENVIRONMENT === 'test' &&
               process.env.TEST &&
               process.env.TEST.includes('cards/') ? defaultRouter : portfolioRouter;
  factory.addResource('content-types', 'app-cards')
    .withAttributes({ router });
  factory.addResource('app-cards', 'portfolio');

  factory.addResource('grants')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withAttributes({
      'may-login': true,
      'may-read-resource': true,
      'may-read-fields': true,
      'may-create-resource': true,
      'may-update-resource': true,
      'may-delete-resource': true,
      'may-write-fields': true,
    });

  return factory.getModels();
};
