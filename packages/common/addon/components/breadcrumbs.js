import Component from '@ember/component';
import { computed } from '@ember/object';
import { equal, match } from '@ember/object/computed';
import layout from '../templates/breadcrumbs';

export default Component.extend({
  layout,
  tagName: '',
  isAsset: equal('content.type', 'asset'),
  isTransaction: match('content.type', /.*?-transaction/),

  assetPath: computed('transactionTo', function () {
    let address = this.content.get('transactionTo');
    if (!address) { return; }

    return `/assets/${address}`;
  }),

  assetType: computed('type', function () {
    let type = this.content.get('type');
    if (!type || !type.includes('-')) { return; }

    let network = type.slice(0, type.indexOf('-')).toLowerCase();
    if (network === 'ethereum') { return 'ether'; }
    return network;
  }),

  abbreviatedAddress: computed('transactionTo', function () {
    // TO DO: Currently only using "To Address" because more of those are indexed
    let address = this.content.get('transactionTo');
    if (!address) { return; }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }),
});
