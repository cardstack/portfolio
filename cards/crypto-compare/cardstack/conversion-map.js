const { erc20Tokens } = require('portfolio-utils');

let conversionMap = {
  BTC: ['USD', 'EUR'],
  ETH: ['USD', 'EUR'],
  LTC: ['USD', 'EUR'],
  ZEC: ['USD', 'EUR']
};

for (let token of erc20Tokens) {
  conversionMap[token.symbol] = ['USD', 'EUR'];
}

module.exports = conversionMap;