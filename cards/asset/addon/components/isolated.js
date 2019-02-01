import Ember from 'ember';
import AssetBaseMixin from '../mixins/asset-base';
import CurrencyParamsMixin from 'portfolio-common/mixins/currency-params';
import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import injectOptional from 'ember-inject-optional';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

export default LiveIsolatedCard.extend(AssetBaseMixin, CurrencyParamsMixin, {
  layout,

  cardstackData: service(),
  selectedCurrency: service(),
  fastboot: injectOptional.service(),

  currency: readOnly('selectedCurrency.currency'),

  chronologicallyDescendingTransactions: computed('content.networkAsset.transactions.[]', function() {
    let transactions = this.get('content.networkAsset.transactions');
    if (!transactions) { return; }

    return transactions.toArray().reverse();
  }),

  addressLink: computed('content.formattedAddress', function() {
    return `https://rinkeby.etherscan.io/address/${this.get('content.formattedAddress')}`;
  }),

  init() {
    this._super();
    if (this.get('fastboot.isFastboot')) {
      this.get('fastboot').deferRendering(this.fetchWallet.perform().then());
    } else {
      this.fetchWallet.perform();
    }
  },

  fetchWallet: task(function * () {
    if (Ember.testing) { return; }
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
  }),

  // TODO turn this into server side copmuted
  assetBalance: computed('content', 'wallet', function() {
    // let balance = this.dummyAccount.balanceFor(this.wallet, {
    //   asset: this.content
    // });
    // // Avoid displaying NaN
    // if (balance) {
    //   return roundWithPrecision([ balance, 4 ]);
    // }
  }),

  // TODO turn this into server side computed
  assetValue: computed('content', 'wallet', 'currency', function() {
    // let assetValue = this.dummyAccount.balanceFor(this.wallet, {
    //   asset: this.content,
    //   inCurrency: this.currency
    // });
    // // Avoid displaying NaN
    // if (assetValue) {
    //   return roundWithPrecision([ assetValue, 2 ]);
    // }
  }),
});
