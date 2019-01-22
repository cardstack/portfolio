import Web3 from 'web3';
import { helper } from '@ember/component/helper';
const DISPLAY_DECIMALS = 4;

export function weiToEthers(wei, displayDecimalPlaces) {
  if (wei == null) { return; }

  displayDecimalPlaces = displayDecimalPlaces == null ? DISPLAY_DECIMALS : displayDecimalPlaces;
  return parseFloat(Web3.utils.fromWei(wei, 'ether')).toFixed(displayDecimalPlaces);
}

export default helper(function([ wei, displayDecimalPlaces ]) {
  return weiToEthers(wei, displayDecimalPlaces);
});