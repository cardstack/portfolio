import Component from '@ember/component';
import { computed } from '@ember/object';
import { readOnly, equal, match } from '@ember/object/computed';
import layout from '../templates/breadcrumbs';

export default Component.extend({
  layout,
  tagName: '',
  userId: readOnly('cardstackData.session.data.authenticated.data.id'),
  isAsset: equal('content.type', 'asset'),
  isTransaction: match('content.type', /.*?-transaction/),
  toEthAddress: readOnly('content.toAddress.ethereumAddress'),

  assetPath: computed('toEthAddress', function () {
    let address = this.get('toEthAddress');
    if (!address) { return; }

    return `/assets/${address}`;
  }),

  assetType: computed('content.type', function () {
    let type = this.get('content.type');
    if (!type || !type.includes('-')) { return; }

    let network = type.slice(0, type.indexOf('-')).toLowerCase();
    if (network === 'ethereum') { return 'ether'; }
    return network;
  }),

  abbreviatedAddress: computed('toEthAddress', function () {
    // TO DO: Currently only using "To Address". Which one to display here???
    let address = this.get('toEthAddress');
    if (!address) { return; }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }),
});
