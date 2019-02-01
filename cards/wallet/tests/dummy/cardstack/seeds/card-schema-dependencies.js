const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { existsSync } = require('fs');
const { join } = require('path');
const cardDir = join(__dirname, '../../../../../');
const thisCardsSchema = require('../../../../cardstack/static-model')();
const mockEthereumSchema = require('../../../../../../shared-data/mock-ethereum-schema');
const mockNetworkSchema = require('../../../../../../shared-data/mock-network-schema');

const cardDependencies = ['user', 'asset', 'network', 'crypto-compare', 'transaction'];

let factory = new JSONAPIFactory();
for (let cardName of cardDependencies) {
  let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
  if (!existsSync(schemaFile)) { continue; }

  factory.importModels(require(schemaFile)());
}
  factory.importModels(thisCardsSchema);

module.exports = factory.getModels().concat(mockEthereumSchema, mockNetworkSchema);