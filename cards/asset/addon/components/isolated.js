import AssetBaseMixin from '../mixins/asset-base';
import CurrencyParamsMixin from 'portfolio-common/mixins/currency-params';
import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

function round(value, precision) {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

export default LiveIsolatedCard.extend(AssetBaseMixin, CurrencyParamsMixin, {
  layout,

  dummyAccount: service(),
  cardstackData: service(),
  selectedCurrency: service(),

  currency: readOnly('selectedCurrency.currency'),

  chronologicallyDescendingTransactions: computed('content.networkAsset.transactions.[]', function() {
    let transactions = this.get('content.networkAsset.transactions');
    if (!transactions) { return; }

    return transactions.toArray().reverse();
  }),

  addressLink: computed('content.formattedAddress', function() {
    return `https://rinkeby.etherscan.io/address/${this.get('content.formattedAddress')}`;
  }),

  fetchWallet: task(function * () {
    let query = {
      filter: {
        ['assets.id']: {
          exact: this.get('content.id')
        }
      },
      type: 'wallet'
    };

    let models = yield this.cardstackData.query('embedded', query);
    let wallet = models.get('firstObject');
    this.set('wallet', wallet);
  }).on('init'),

  assetBalance: computed('content', 'wallet', function() {
    let balance = this.dummyAccount.balanceFor(this.wallet, {
      asset: this.content
    });
    // Avoid displaying NaN
    if (balance) {
      return round(balance, 4);
    }
  }),

  assetValue: computed('content', 'wallet', 'currency', function() {
    let assetValue = this.dummyAccount.balanceFor(this.wallet, {
      asset: this.content,
      inCurrency: this.currency
    });
    // Avoid displaying NaN
    if (assetValue) {
      return round(assetValue, 2);
    }
  }),
});
