
import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import Web3 from 'web3';

export default Component.extend({
  date: computed('content.timestamp', function() {
    let timestamp = this.get('content.timestamp');
    if (!timestamp) { return; }

    return moment.unix(timestamp).format('MMM D, YYYY h:mm A');
  }),

  datetime: computed('content.timestamp', function() {
    let timestamp = this.get('content.timestamp');
    if (!timestamp) { return; }

    return moment.unix(timestamp).format('MMM D, YYYY hh:mm:ss A Z');
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

  transactionCost: computed('content.{gasPrice,gasUsed}', function() {
    let gasPrice = this.get('content.gasPrice');
    let gasUsed = this.get('content.gasUsed');
    if (!gasPrice || !gasUsed) { return; }

    let BN = Web3.utils.BN;
    let price = new BN(gasPrice);
    let used = new BN(gasUsed);

    return Web3.utils.fromWei(price.mul(used), 'Gwei');
  }),

  transactionHashLink: computed('content.transactionHash', function() {
    let hash = this.get('content.transactionHash');

    return `https://etherscan.io/tx/${hash}`;
  }),

  abbreviatedFromAddress: computed('content.transactionFrom', function() {
    let address = this.get('content.transactionFrom');

    return this.abbreviatedAddress(address);
  }),
  abbreviatedToAddress: computed('content.transactionTo', function() {
    let address = this.get('content.transactionTo');

    return this.abbreviatedAddress(address);
  }),
  abbreviatedTransactionHash: computed('content.transactionHash', function() {
    let address = this.get('content.transactionHash');

    return this.abbreviatedAddress(address);
  }),

  abbreviatedAddress(address) {
    if (!address) { return; }

    return `${address.slice(0,6)}...${address.slice(-4)}`;
  }
});
