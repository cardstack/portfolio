import { helper } from '@ember/component/helper';

export default helper(function([value, decimals=2]) {
  return value.toFixed(decimals);
});
