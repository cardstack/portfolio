import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

export default LiveIsolatedCard.extend({
  layout,

  dummyAccount: service(),

  accountTotalInUSD: computed('wallets.[]', function() {
    let total = this.content.get('wallets').toArray().reduce((sum, wallet) => {
      let total = this.dummyAccount.balanceFor(wallet, {
        inCurrency: 'USD'
      });
      return sum + total;
    }, 0);
    return roundWithPrecision([total, 2]);
  }),
});
