import { helper } from '@ember/component/helper';

export function roundWithPrecision(params) {
  let [ value, precision=2 ] = params;
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

export default helper(roundWithPrecision);
