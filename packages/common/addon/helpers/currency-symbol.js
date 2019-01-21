import { helper } from '@ember/component/helper';
export const symbolMapping = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'BTC': '฿',
  'JPY': '¥'
};
export function currencySymbol(currency) {
  if (currency) {
    return symbolMapping[currency] || currency;
  }
}

export default helper(function([ currency ]) {
  return currencySymbol(currency);
});