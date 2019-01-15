const { readdirSync, existsSync } = require('fs');
const { join } = require('path');
const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

const cardDir = join(__dirname, '../../../cards');

let factory = new JSONAPIFactory();

if (process.env.HUB_ENVIRONMENT === 'development') {
  for (let cardName of readdirSync(cardDir)) {
    let sampleFile = join(cardDir, cardName, 'cardstack','seeds','samples.js');
    if (existsSync(sampleFile) ) {
      factory.importModels(require(sampleFile));
    }
  }
}

module.exports = factory.getModels();
