import Web3 from 'web3';
import { helper } from '@ember/component/helper';
import { getRate } from './get-rate';

const { utils: { BN } } = Web3;
const displayDecimalPlaces = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  JPY: 0,
  CNY: 0,
  BTC: 4,
};
const decimalsPrecision = Math.max(...Object.values(displayDecimalPlaces));

export function convertCurrency(fromCurrency, toCurrency, fromValue, rates) {
  if (!fromCurrency || !toCurrency || fromValue == null || !rates) { return; }

  let rate, rateCents;
  // crypto currency doesn't do conversion between crypto currencies, rather just from crypto currencies to fiat currencies.
  // so we need to use a fiat currency as an intermediary to convert from a crypto currency to another crypto currency
  if (toCurrency === 'BTC') {
    let btcToUsdRate = getRate('BTC', 'USD', rates);
    let cryptoToUsdRate = getRate(fromCurrency, 'USD', rates);
    if (!cryptoToUsdRate || !btcToUsdRate) { return; }

    rateCents = Math.round(parseFloat(cryptoToUsdRate.get('cents')) / parseFloat(btcToUsdRate.get('cents')));
  } else {
    rate = getRate(fromCurrency, toCurrency, rates);
  }
  if (!rate && !rateCents) { return; }

  // When we do this for other crypto currencies we should use BigNumber, as those currenies use really small units like satoshi for bitcoin
  if (fromCurrency !== 'ETH') {
    return parseFloat(fromValue) * parseFloat(rateCents || rate.get('cents')) / (Math.pow(10, displayDecimalPlaces[toCurrency] || 2));
  }

  let factor = Math.pow(10, decimalsPrecision); // BigNumber doesn't handle decimals so everything needs to be converted to whole numbers
  let rateAsCents = new BN(rateCents || rate.get('cents'));
  let centsFactor = (new BN(Web3.utils.fromWei(fromValue, 'ether')).mul(new BN(factor))).div(rateAsCents);
  // ok, the BigNumber should be in safe javascript territory now, so let do normal js math
  let currencyDecimalPlaces = displayDecimalPlaces[toCurrency] || 2;
  let toCurrenyUnits = ((parseFloat(centsFactor, 10) / parseFloat(factor)) / Math.pow(10, currencyDecimalPlaces)).toFixed(currencyDecimalPlaces);
  return toCurrenyUnits;

}

export default helper(function ([fromCurrency, toCurrency, fromValue, rates]) {
  return convertCurrency(fromCurrency, toCurrency, fromValue, rates);
});