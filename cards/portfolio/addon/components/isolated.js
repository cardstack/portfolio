import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

export default LiveIsolatedCard.extend({
  layout,

  dummyAccount: service(),
  selectedCurrency: service(),

  currency: readOnly('selectedCurrency.currency'),

  accountTotal: computed('wallets.[]', 'currency', function() {
    let total = this.content.get('wallets').toArray().reduce((sum, wallet) => {
      let total = this.dummyAccount.balanceFor(wallet, {
        inCurrency: this.currency
      });
      return sum + total;
    }, 0);
    return roundWithPrecision([total, 2]);
  }),

  walletCount: computed('wallets.[]', function () {
    let wallets = this.content.get('wallets');
    if (!wallets) { return; }
    return wallets.length;
  })
});
