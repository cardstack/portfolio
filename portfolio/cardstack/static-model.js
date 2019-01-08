const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const cardDir = join(__dirname, '../../cards');
const portfolioRouter = require('./router');
const defaultRouter = require('@cardstack/routing/cardstack/default-router');
const { hashPasswordSync } = require('portfolio-crypto');

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

  factory.addResource('data-sources', 'portfolio-user')
    .withAttributes({
      sourceType: 'portfolio-user',
    });

  // Create a user to test login here as
  // the crypto package is for node.js only
  // for non-login tests we can use a normal
  // mock auth user created in the test fixtures
  if (process.env.HUB_ENVIRONMENT === 'test') {
    factory.addResource('portfolio-users', 'test-user').withAttributes({
      'email-address': 'hassan@example.com',
      'password-hash': hashPasswordSync('password')
    });
  }

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
