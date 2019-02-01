import Component from '@ember/component';
import layout from '../templates/embedded';
import WalletBaseMixin from '../mixins/wallet-base';

export default Component.extend(WalletBaseMixin, {
  layout,
});
