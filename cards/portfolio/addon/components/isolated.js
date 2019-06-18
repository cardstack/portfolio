import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { computed } from '@ember/object';
import { readOnly, equal, sort } from '@ember/object/computed';

const OVERVIEW = {
  title: 'overview',
  description: 'Your most recently used Credentials, Memberships & Tracked Assets',
}

const MEMBERSHIPS = {
  title: 'memberships',
  description: 'Coming Soon'
};

const ASSETS = {
  title: 'assets',
  description: 'All of your tracked Assets and Tokens lorem ipsum dolor',
};

const SECTIONS = [ MEMBERSHIPS, ASSETS ];

const DEFAULTSORT = { name: 'Balance (Descending)', id: 'descending' };

const SORTINGOPTIONS = [
  DEFAULTSORT,
  { name: 'Balance (Ascending)', id: 'ascending' },
];

export default LiveIsolatedCard.extend({
  layout,
  isDismissed: false,
  // TODO: need to access network names within the given wallet. using the first wallet for now
  network: readOnly('content.wallets.[].firstObject'),
  assets: readOnly('network.assets.[]'),
  activeSection: OVERVIEW,
  isOverviewActive: equal('activeSection.title', 'overview'),
  isAssetsSection: equal('activeSection.title', 'assets'),
  displaySections: SECTIONS,
  isListView: false,
  sortingOptions: SORTINGOPTIONS,
  selected: DEFAULTSORT,
  sortedAssets: sort('assets.[]', 'sortAssetsByBalance'),
  sortBy: 'networkBalance',

  ascending: computed('selected', function() {
    let selection = this.selected;

    if (!selection || selection.id === 'descending') {
      return false;
    }

    return true;
  }),

  sortAssetsByBalance: computed('sortBy', 'ascending', function() {
    let sortOrder = this.ascending ? 'asc' : 'desc';
    return [ `${this.get('sortBy')}:${sortOrder}` ];
  }),

  actions: {
    setActiveSection(section) {
      if (!section) {
        return this.set('activeSection', OVERVIEW);
      }
      this.set('activeSection', section);
    },

    setListView() {
      this.set('isListView', true);
    },

    unsetListView() {
      this.set('isListView', false);
    },

    dismiss() {
      this.set('isDismissed', true);
    }
  }
});
