const { erc20Tokens } = require('portfolio-utils');

exports.type = '@cardstack/core-types::has-many';

exports.compute = async function(model) {
  let [walletName, id] = model.id.toLowerCase().split('-');

  if (walletName !== 'metamask' || !id) { return; }

  return erc20Tokens.map(token => {
    let type = `${token.symbol.toLowerCase()}-token-balance-ofs`;

    return { id, type };
  }).filter(Boolean);
};