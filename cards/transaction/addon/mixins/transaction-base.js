
import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import moment from 'moment';
import Web3 from 'web3';

const { readOnly } = computed;
const { utils: { BN, fromWei } } = Web3;

export default Mixin.create({
  selectedCurrency: service(),
  currency: readOnly('selectedCurrency.currency'),

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

  transactionCostWei: computed('content.{gasPrice,gasUsed}', function() {
    let gasPrice = this.get('content.gasPrice');
    let gasUsed = this.get('content.gasUsed');
    if (!gasPrice || !gasUsed) { return; }

    let price = new BN(gasPrice);
    let used = new BN(gasUsed);

    return price.mul(used).toString();
  }),

  gasPriceGwei: computed('content.gasPrice', function() {
    let gasPrice = this.get('content.gasPrice');
    return fromWei(gasPrice || "0", 'gwei');
  }),

  transactionHashLink: computed('content.transactionHash', function() {
    let hash = this.get('content.transactionHash');

    return `https://rinkeby.etherscan.io/tx/${hash}`;
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
