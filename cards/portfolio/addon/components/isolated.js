import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';

export default LiveIsolatedCard.extend({
  layout,
  isDismissed: false,
  displayGroup: 'all',

  actions: {
    displayAssets() {
      this.set('displayGroup', 'assets');
    },

    displayMemberships() {
      this.set('displayGroup', 'memberships');
    },

    displayAll() {
      this.set('displayGroup', 'all');
    },

    dismiss() {
      this.set('isDismissed', true);
    }
  }
});
