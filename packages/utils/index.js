
const { utils: { BN } } = require('web3');
const { get } = require('lodash');

function updateBalanceFromTransaction(balance, _address, transaction) {
  let address = _address.toLowerCase();
  let isSuccessfulTxn = get(transaction, 'attributes.transaction-successful');
  let from = get(transaction, 'attributes.transaction-from');
  let to = get(transaction, 'attributes.transaction-to');
  let value = get(transaction, 'attributes.transaction-value') || '0';
  let gasUsed = get(transaction, 'attributes.gas-used') || 0;
  let gasPrice = get(transaction, 'attributes.gas-price') || '0';

  if (isSuccessfulTxn && address === from.toLowerCase()) {
    let gasCost = (new BN(gasUsed)).mul(new BN(gasPrice));
    balance = balance.sub(new BN(value)).sub(gasCost);
    if (balance.isNeg()) {
      throw new Error(`Error: the historic balance for address ${from} resulted in a negative balance at block #${transaction.attributes['block-number']} for transaction hash ${transaction.id}. This should never happen and indicates a bug in the historic value logic.`);
    }
  }

  if (isSuccessfulTxn && to && address === to.toLowerCase()) {
    balance = balance.add(new BN(value));
  }

  return balance;
}

module.exports = {
  updateBalanceFromTransaction
};
