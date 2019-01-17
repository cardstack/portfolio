import { helper } from '@ember/component/helper';

export function getRate(fromCurrency, toCurrency, rates) {
  if (!fromCurrency || !toCurrency || !rates) { return; }

  return rates.find(i => i.get('fromCryptoCurrency') === fromCurrency && i.get('toFiatCurrency') === toCurrency);
}

export default helper(function([ fromCurrency, toCurrency, rates ]) {
  return getRate(fromCurrency, toCurrency, rates);
});