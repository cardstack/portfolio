
import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import Web3 from 'web3';

export default Component.extend({
  date: computed('content.timestamp', function() {
    let timestamp = this.get('content.timestamp');
    if (!timestamp) { return; }

    return moment.unix(timestamp).format('MMM D, YYYY h:mm a');
  }),
  
  firstTransactionDate: computed('content.firstTransactionTimestamp', function() {
    let timestamp = this.get('content.firstTransactionTimestamp');
    if (!timestamp) { return; }

    return moment.unix(timestamp).format('MMM D,YYYY')
  }),

  transactionValue: computed('content.transactionValue', function() {
    let value = this.get('content.transactionValue');
    if (!value) { return; }

    return parseFloat(Web3.utils.fromWei(value, 'ether')).toFixed(4);
  }),

  abbreviatedFromAddress: computed('content.transactionFrom', function() {
    let address = this.get('content.transactionFrom');

    return this.abbreviatedAddress(address);
  }),
  abbreviatedToAddress: computed('content.transactionTo', function() {
    let address = this.get('content.transactionTo');

    return this.abbreviatedAddress(address);
  }),

  abbreviatedAddress(address) {
    if (!address) { return; }

    return `${address.slice(0,6)}...${address.slice(-4)}`;
  }
});
