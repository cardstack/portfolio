import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import moment from 'moment';
const { readOnly } = computed;

export default Mixin.create({
  currency: readOnly('selectedCurrency.currency'),
  selectedCurrency: service(),
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
  twoLineAddress: computed('content.formattedAddress', function() {
    let address = this.get('content.formattedAddress');
    if (!address) { return; }

    return `${address.slice(0,address.length/2)}\n${address.slice(-address.length/2)}`;
  }),
});