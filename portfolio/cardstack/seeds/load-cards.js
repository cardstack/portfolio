const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { hashPasswordSync } = require('portfolio-crypto');

const cardDir = join(__dirname, '../../../cards');

let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  for (let cardName of readdirSync(cardDir)) {
    let sampleFile = join(cardDir, cardName, 'cardstack','seeds','samples.js');
    if (existsSync(sampleFile) ) {
      factory.importModels(require(sampleFile));
    }
  }

  factory.addResource('portfolio-users', 'test-user').withAttributes({
    'email-address': 'user@cardstack.com',
    'password-hash': hashPasswordSync('password')
  });
}

module.exports = factory.getModels();
