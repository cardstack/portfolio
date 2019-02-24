const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const cardDir = join(__dirname, '../../cards');
const portfolioRouter = require('./router');
const defaultRouter = require('@cardstack/routing/cardstack/default-router');
const mockEthereumSchema = require('../../shared-data/mock-ethereum-schema');
const mockNetworkSchema = require('../../shared-data/mock-network-schema');

module.exports = function () {
  let factory = new JSONAPIFactory();
  let cardSchemas = new JSONAPIFactory();
  let dataSources = new JSONAPIFactory();

  for (let dataSourceFile of readdirSync(join(__dirname, 'data-sources'))) {
    let filePath = join(__dirname, 'data-sources', dataSourceFile);
    dataSources.importModels(require(filePath));
  }
  let dataSourceTypes = dataSources.getModels().filter(i => i.type === 'data-sources')
                                               .map(i => i.attributes.sourceType || i.attributes['source-type']);
  for (let cardName of readdirSync(cardDir)) {
    let packageJsonFile = join(cardDir, cardName, 'package.json');
    if (!existsSync(packageJsonFile)) { continue; }

    let packageJson = require(packageJsonFile);
    if (dataSourceTypes.includes(packageJson.name)) { continue; }

    let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
    if (existsSync(schemaFile)) {
      cardSchemas.importModels(require(schemaFile)());
      factory.addResource('data-sources')
        .withAttributes({ sourceType: `portfolio-${cardName}` });
    }
  }

  let router = process.env.HUB_ENVIRONMENT === 'test' &&
    process.env.TEST &&
    process.env.TEST.includes('cards/') ? defaultRouter : portfolioRouter;
  factory.addResource('content-types', 'app-cards')
    .withAttributes({ router });
  factory.addResource('app-cards', 'portfolio');

  factory.addResource('grants', 'app-card-grant')
    .withRelated('who', [{ type: 'groups', id: 'everyone' }])
    .withRelated('types', [
      { type: 'content-types', id: 'content-types' },
      { type: 'content-types', id: 'spaces' }
    ])
    .withAttributes({
      'may-read-resource': true,
      'may-read-fields': true,
    });

  if (!process.env.JSON_RPC_URLS) {
    factory.importModels(mockEthereumSchema);
  }
  factory.importModels(mockNetworkSchema);

  return factory.getModels();
};
