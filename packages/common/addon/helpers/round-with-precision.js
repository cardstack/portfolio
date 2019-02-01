import { helper } from '@ember/component/helper';

export function roundWithPrecision(value, precision=2) {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

export default helper(function([value, precision]) {
  return roundWithPrecision(value, precision);
});
