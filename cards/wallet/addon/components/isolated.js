import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import WalletBaseMixin from '../mixins/wallet-base';

export default LiveIsolatedCard.extend(WalletBaseMixin, {
  layout,
});
