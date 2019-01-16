import Web3 from 'web3';
import { helper } from '@ember/component/helper';
const DISPLAY_DECIMALS = 4;

export function weiToEthers(wei) {
  if (wei == null) { return; }

  return parseFloat(Web3.utils.fromWei(wei, 'ether')).toFixed(DISPLAY_DECIMALS);
}

export default helper(function([ wei ]) {
  return weiToEthers(wei);
});