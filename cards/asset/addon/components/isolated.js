import AssetBaseMixin from '../mixins/asset-base';
import CurrencyParamsMixin from 'portfolio-common/mixins/currency-params';
import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { inject as service } from '@ember/service';
import injectOptional from 'ember-inject-optional';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default LiveIsolatedCard.extend(AssetBaseMixin, CurrencyParamsMixin, {
  layout,
  cardstackData: service(),
  fastboot: injectOptional.service(),

  chronologicallyDescendingTransactions: computed('content.networkAsset.transactions.[]', function() {
    let transactions = this.get('content.networkAsset.transactions');
    if (!transactions) { return; }

    return transactions.toArray().reverse();
  }),

  addressLink: computed('content.formattedAddress', function() {
    return `https://rinkeby.etherscan.io/address/${this.get('content.formattedAddress')}`;
  }),

  // TODO let's stop doing this after we have query based relationships
  init() {
    this._super();
    if (this.get('fastboot.isFastboot')) {
      this.get('fastboot').deferRendering(this.fetchWallet.perform().then());
    } else {
      this.fetchWallet.perform();
    }
  },

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
    if (models.get('length')) {
      let wallet = models.get('firstObject');
      this.set('wallet', wallet);
    }
  }).drop(),
});
