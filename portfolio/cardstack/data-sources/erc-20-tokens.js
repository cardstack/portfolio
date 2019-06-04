const abi = require('../contracts/erc-20-abi');
const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const { erc20Tokens } = require('portfolio-utils');

let factory = new JSONAPIFactory();

if (process.env.JSON_RPC_URLS) {

  for (let token of erc20Tokens) {
    let tokenName = token.symbol.toLowerCase();
    let address = token.contractAddress;
    factory.addResource('data-sources', `${tokenName}-token`)
      .withAttributes({
        'source-type': '@cardstack/ethereum',
        params: {
          jsonRpcUrls: process.env.JSON_RPC_URLS.split(',').map(i => i.trim()),
          contract: {
            abi: abi,
            address: address,
            eventContentTriggers: {
              Transfer: [`${tokenName}-token-balance-ofs`],
            }
          },
        },
      });
  }
}

module.exports = factory.getModels();
