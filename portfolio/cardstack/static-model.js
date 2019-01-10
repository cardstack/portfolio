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

  factory.addResource('data-sources', 'portfolio-user')
    .withAttributes({
      sourceType: 'portfolio-user',
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
  // TODO we need to lock these down and add tests...
  .withRelated('who', [{ type: 'groups', id: 'everyone' }])
  .withRelated('types', [
      { type: 'content-types', id: 'wallets' }, // TODO move this to wallet card and lock it down and add grant tests (see portfolio card for examples)
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
