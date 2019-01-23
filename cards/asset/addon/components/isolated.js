import AssetBaseMixin from '../mixins/asset-base';
import CurrencyParamsMixin from 'portfolio-common/mixins/currency-params';
import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { computed } from '@ember/object';

export default LiveIsolatedCard.extend(AssetBaseMixin, CurrencyParamsMixin, {
  layout,

  chronologicallyDescendingTransactions: computed('content.networkAsset.transactions.[]', function() {
    let transactions = this.get('content.networkAsset.transactions');
    if (!transactions) { return; }

    return transactions.toArray().reverse();
  }),

  addressLink: computed('content.formattedAddress', function() {
    return `https://rinkeby.etherscan.io/address/${this.get('content.formattedAddress')}`;
  }),
});