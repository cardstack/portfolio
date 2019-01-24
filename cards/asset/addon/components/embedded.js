import Ember from 'ember';
import Component from '@ember/component';
import AssetBaseMixin from '../mixins/asset-base';
import layout from '../templates/embedded';
import { inject as service } from '@ember/service';
import injectOptional from 'ember-inject-optional';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { readOnly } from '@ember/object/computed';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

export default Component.extend(AssetBaseMixin, {
  layout,

  dummyAccount: service(),
  cardstackData: service(),
  selectedCurrency: service(),
  fastboot: injectOptional.service(),

  currency: readOnly('selectedCurrency.currency'),

  init() {
    this._super();
    if (this.get('fastboot.isFastboot')) {
      this.get('fastboot').deferRendering(this.fetchWallet.perform().then());
    } else {
      this.fetchWallet.perform();
    }
  },

  assetLink: computed(function() {
    return `/assets/${this.get('content.id')}`;
  }),

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

  assetBalance: computed('content', 'wallet', function() {
    let balance = this.dummyAccount.balanceFor(this.wallet, {
      asset: this.content
    });
    // Avoid displaying NaN temporarily
    if (balance) {
      return roundWithPrecision([ balance, 4 ]);
    }
  }),

  assetValue: computed('content', 'wallet', 'currency', function() {
    let assetValue = this.dummyAccount.balanceFor(this.wallet, {
      asset: this.content,
      inCurrency: this.currency
    });
    // Avoid displaying NaN
    if (assetValue) {
      return roundWithPrecision([ assetValue, 2 ]);
    }
  }),
});
