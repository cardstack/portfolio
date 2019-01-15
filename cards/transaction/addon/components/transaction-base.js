
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
  })
});
