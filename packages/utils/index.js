
const log = require('@cardstack/logger')('portfolio/utils');
const { utils: { BN, fromWei } } = require('web3');
const { get } = require('lodash');

const currencyCentsDecimalPlaces = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  JPY: 0,
  CNY: 0,
  BTC: 0,
};

function updateBalanceFromTransaction(balance, _address, transaction) {
  let address = _address.toLowerCase();
  let isSuccessfulTxn = get(transaction, 'attributes.transaction-successful');
  let blockNumber = get(transaction, 'attributes.block-number');
  let from = get(transaction, 'attributes.transaction-from');
  let to = get(transaction, 'attributes.transaction-to');
  let value = get(transaction, 'attributes.transaction-value') || '0';
  let gasUsed = get(transaction, 'attributes.gas-used') || 0;
  let gasPrice = get(transaction, 'attributes.gas-price') || '0';

  if (isSuccessfulTxn && address === from.toLowerCase()) {
    let gasCost = (new BN(gasUsed)).mul(new BN(gasPrice));
    balance = balance.sub(new BN(value)).sub(gasCost);
    if (balance.isNeg()) {
      log.error(`Negative balance for ${address} at block ${blockNumber} using txn ${transaction.id} with txn value: ${value}, gas price: ${gasPrice}, gas used: ${gasUsed}, is successful txn: ${isSuccessfulTxn}`);
      throw new Error(`ERROR: the historic balance for address ${from} resulted in a negative balance at block #${transaction.attributes['block-number']} for transaction hash ${transaction.id}. This should never happen and indicates a bug in the historic value logic.`);
    }
  }

  if (isSuccessfulTxn && to && address === to.toLowerCase()) {
    balance = balance.add(new BN(value));
  }
  log.debug(`balance for ${address} at block ${blockNumber} using txn ${transaction.id} is ${balance.toString()} with txn value: ${value}, gas price: ${gasPrice}, gas used: ${gasUsed}, is successful txn: ${isSuccessfulTxn}`);

  return balance;
}

async function convertCurrency(fromCurrency, toCurrency, value, rates) {
  let balanceInCryptoDenomination = parseFloat(fromWei(value, 'ether')); // this is taking advantage of the fact that all the mock cryptos use wei as their denomination
  let rateCents = await conversionRate(fromCurrency, toCurrency, rates);
  let currencyDecimalPlaces = currencyCentsDecimalPlaces[toCurrency] || 2;
  let toRawCurrenyUnits = (rateCents * balanceInCryptoDenomination) / Math.pow(10, currencyDecimalPlaces);
  return toRawCurrenyUnits;

}

async function conversionRate(fromCurrency, toCurrency, rates) {
  if (toCurrency === 'BTC') {
    let btcToUsdRate = await getRate('BTC', 'USD', rates);
    let ethToUsdRate = await getRate(fromCurrency, 'USD', rates);
    if (!ethToUsdRate || !btcToUsdRate) { return; }

    let cryptoToUsdInCents = parseFloat(await ethToUsdRate.getField('cents'));
    let btcToUsdInCents = parseFloat(await btcToUsdRate.getField('cents'));

    return (cryptoToUsdInCents/btcToUsdInCents) * 100;
  } else {
    let cryptoToFiatRate = await getRate(fromCurrency, toCurrency, rates);
    if (!cryptoToFiatRate) { return; }
    return await cryptoToFiatRate.getField('cents');
  }
}

async function getRate(fromCurrency, toCurrency, rates) {
  if (!fromCurrency || !toCurrency || !rates) { return; }

  return await find(rates, async r =>
    await r.getField('from-crypto-currency') === fromCurrency &&
    await r.getField('to-fiat-currency') === toCurrency);
}

async function find(list, predicate) {
  for (let element of list) {
    if (await predicate(element)) {
      return element;
    }
  }
}

module.exports = {
  conversionRate,
  convertCurrency,
  currencyCentsDecimalPlaces,
  updateBalanceFromTransaction
};
