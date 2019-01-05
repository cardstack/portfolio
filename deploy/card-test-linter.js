const yaml = require('js-yaml');
const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const cardDir = join(__dirname, '../cards');
const travisYml = join(__dirname, '../.travis.yml');

let travis = yaml.safeLoad(readFileSync(travisYml, 'utf8'));

let testedCards = travis.jobs.include
  .map(it => it.env)
  .filter(Boolean)
  .map(it => it.split(' ').find(i => i.indexOf('TEST=') > -1))
  .filter(it => it.indexOf('TEST=cards/') === 0)
  .map(i => i.replace(/TEST=cards\//g, ''));

for (let cardName of readdirSync(cardDir)) {
  if (cardName.charAt(0) === '.') { continue; }

  if (!testedCards.includes(cardName)) {
    throw new Error (`The card 'cards/${cardName}' is not being tested in travis CI. Please add this card to the 'env' testing matrix in .travis.yml.`);
  }
}
