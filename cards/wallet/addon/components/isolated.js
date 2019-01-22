import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default LiveIsolatedCard.extend({
  layout,

  dummyAccount: service(),

  accountUSDTotal: computed('content', function() {
    let total = this.dummyAccount.balanceFor(this.content, {
      inCurrency: 'USD'
    });
    return Math.round(total * Math.pow(10, 2)) / Math.pow(10, 2);
  })
});
