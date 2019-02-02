import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';

const precision = {
  USD: 2,
  EUR: 2,
  BTC: 4
};

export default LiveIsolatedCard.extend({
  layout,
  precision,
  selectedCurrency: service(),
  store: service(),

  currency: readOnly('selectedCurrency.currency'),
  groupBy: 'wallets',

  totalBalance: computed('content.totalWalletsBalance', 'currency', function() {
    let currency = this.get('currency');
    let balance = this.get('content.totalWalletsBalance');
    if (!balance) { return; }

    return balance[currency].toFixed(precision[currency]);
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
