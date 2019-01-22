import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import TransactionBaseMixin from '../mixins/transaction-base';
import layout from '../templates/isolated';

export default LiveIsolatedCard.extend(TransactionBaseMixin, { layout });