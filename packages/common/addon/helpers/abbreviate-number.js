import { helper } from '@ember/component/helper';

const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

export function abbreviateNumber(number){

    if (number < 1) { return number; }

    // what tier? (determines SI symbol)
    let tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a suffix
    if (tier === 0) { return number; }

    // get suffix and determine scale
    let suffix = SI_SYMBOL[tier];
    let scale = Math.pow(10, tier * 3);

    // scale the number
    let scaled = number / scale;

    // format number and add suffix
    return scaled.toFixed(1) + suffix;
}

export default helper(function([ number ]) {
  return abbreviateNumber(number);
});