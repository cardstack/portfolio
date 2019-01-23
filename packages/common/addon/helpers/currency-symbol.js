import { helper } from '@ember/component/helper';
export const symbolMapping = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  // 'BTC': '฿', this looks super duper tacky
  'JPY': '¥'
};
export function currencySymbol(currency) {
  if (currency) {
    return symbolMapping[currency] || '';
  }
}

export default helper(function([ currency ]) {
  return currencySymbol(currency);
});