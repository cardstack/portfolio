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
  store: service(),

  currency: readOnly('selectedCurrency.currency'),
  groupBy: 'wallets',

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
  }),

  assetsByCurrency: computed('content', 'content.wallets.[]', function() {
    let networks = this.store.peekAll('network').sortBy('title');

    if (!networks) { return; }

    let allAssets = this.store.peekAll('asset');

    let currencyGroups = [];

    networks.forEach(network => {
      let byNetwork = { network };
      let assets = allAssets.filter(asset => asset.get('networkId') === network.id );
      byNetwork.assets = assets;
      currencyGroups.push(byNetwork);
    });

    return currencyGroups;
  }),

  actions: {
    groupByCurrency() {
      this.set('groupBy', 'currency');
    },

    groupByWallet() {
      this.set('groupBy', 'wallets');
    }
  }
});
