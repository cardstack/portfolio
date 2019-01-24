import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';

export default LiveIsolatedCard.extend({
  layout,

  dummyAccount: service(),
  selectedCurrency: service(),

  currency: readOnly('selectedCurrency.currency'),

  accountTotal: computed('content', 'currency', function() {
    let total = this.dummyAccount.balanceFor(this.content, {
      inCurrency: this.currency,
    });
    return Math.round(total * Math.pow(10, 2)) / Math.pow(10, 2);
  })
});
