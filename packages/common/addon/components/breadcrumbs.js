import Component from '@ember/component';
import { computed } from '@ember/object';
import { readOnly, equal, match } from '@ember/object/computed';
import { htmlSafe } from '@ember/string';
import layout from '../templates/breadcrumbs';

export default Component.extend({
  layout,
  tagName: '',
  isAsset: equal('content.type', 'asset'),
  isTransaction: match('content.type', /.*?-transaction/),
  toEthAddress: readOnly('content.toAddress.ethereumAddress'),

  assetUrl: computed('toEthAddress', function () {
    let address = this.get('toEthAddress');
    if (!address) { return; }

    return htmlSafe(`/assets/${address}`);
  }),

  assetType: computed('content.type', function () {
    let type = this.get('content.type');
    if (!type || !type.includes('-')) { return; }

    return type.slice(0, type.indexOf('-')).toUpperCase();
  }),

  abbreviatedAddress: computed('toEthAddress', function () {
    // TO DO: Currently only using "To Address". Which one to display here???
    let address = this.get('toEthAddress');
    if (!address) { return; }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }),
});
