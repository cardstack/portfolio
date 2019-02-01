import Web3 from 'web3';
import { helper } from '@ember/component/helper';
import { getRate } from './get-rate';

export const displayDecimalPlaces = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  JPY: 0,
  CNY: 0,
  BTC: 4,
};

const currencyCentsDecimalPlaces = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  JPY: 0,
  CNY: 0,
  BTC: 0,
};

export function convertCurrency(fromCurrency, toCurrency, fromValue, rates) {
  if (!fromCurrency || !toCurrency || fromValue == null || !rates) { return; }

  let rate, rateCents;
  // crypto currency doesn't do conversion between crypto currencies, rather just from crypto currencies to fiat currencies.
  // so we need to use a fiat currency as an intermediary to convert from a crypto currency to another crypto currency
  if (toCurrency === 'BTC') {
    let btcToUsdRate = getRate('BTC', 'USD', rates);
    let cryptoToUsdRate = getRate(fromCurrency, 'USD', rates);
    if (!cryptoToUsdRate || !btcToUsdRate) { return; }

    rateCents = (parseFloat(cryptoToUsdRate.get('cents')) / parseFloat(btcToUsdRate.get('cents'))) * 100;
  } else {
    rate = getRate(fromCurrency, toCurrency, rates);
  }
  //TODO: Only BTC and ETH rates are fetched
  if (!rate && !rateCents) { return; }

  rateCents = rateCents || rate.get('cents');

  let currencyDecimalPlaces = currencyCentsDecimalPlaces[toCurrency] || 2;

  // For now we are mocking all the other crypto currencies to work like ethers and use 'wei' as it's denomination.
  // Eventually we'll need to use a Big Integer library to deal with each currency's unique denominations
  let fromValueAsEth = parseFloat(Web3.utils.fromWei(fromValue, 'ether'));
  rateCents = parseFloat(rateCents);
  let toCurrenyUnits = ((rateCents * fromValueAsEth) / Math.pow(10, currencyDecimalPlaces))
    .toFixed(displayDecimalPlaces[toCurrency] || 2);
  return toCurrenyUnits;

}

export default helper(function ([fromCurrency, toCurrency, fromValue, rates]) {
  return convertCurrency(fromCurrency, toCurrency, fromValue, rates);
});
