
import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import Web3 from 'web3';

const { readOnly } = computed;

export default Component.extend({
  networkId: readOnly('content.networkId'),
  abbreviatedAddress: computed('content.formattedAddress', function() {
    let address = this.get('content.formattedAddress');
    if (!address) { return; }

    return `${address.slice(0,6)}...${address.slice(-4)}`;
  }),
  lastActiveDate: computed('content.lastTransactionTimestamp', function() {
    let timestamp = this.get('content.lastTransactionTimestamp');
    if (!timestamp) { return; }

    return moment.unix(timestamp).fromNow();
  }),
  firstTransactionDate: computed('content.firstTransactionTimestamp', function() {
    let timestamp = this.get('content.firstTransactionTimestamp');
    if (!timestamp) { return; }

    return moment.unix(timestamp).format('MMM D,YYYY')
  }),
  etherBalance: computed('content.networkAsset.balance', function() {
    let balance = this.get('content.networkAsset.balance');
    if (!balance) { return; }

    return parseFloat(Web3.utils.fromWei(balance, 'ether')).toFixed(4);
  })
});
