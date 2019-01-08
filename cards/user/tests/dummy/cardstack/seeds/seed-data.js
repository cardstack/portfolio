const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { hashPasswordSync } = require('portfolio-crypto');

const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const cardDir = join(__dirname, '../../../../../');

let factory = new JSONAPIFactory();
factory.addResource('data-sources', 'portfolio-user')
  .withAttributes({
    sourceType: 'portfolio-user',
  });

for (let cardName of readdirSync(cardDir)) {
  let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
  if (!existsSync(schemaFile)) { continue; }

  factory.importModels(require(schemaFile)());
}

factory.addResource('portfolio-users', 'test-user').withAttributes({
  'email-address': 'hassan@example.com',
  'password-hash': hashPasswordSync('password')
});

module.exports = factory.getModels();