import Component from '@ember/component';
import AssetBaseMixin from '../mixins/asset-base';
import { computed  } from '@ember/object';
import layout from '../templates/embedded';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { readOnly } from '@ember/object/computed';

function round(value, precision) {
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

export default Component.extend(AssetBaseMixin, {
  layout,

  dummyAccount: service(),
  cardstackData: service(),
  selectedCurrency: service(),

  currency: readOnly('selectedCurrency.currency'),

  assetLink: computed(function() {
    return `/assets/${this.get('content.id')}`;
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
