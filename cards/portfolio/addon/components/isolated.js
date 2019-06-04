import LiveIsolatedCard from 'portfolio-common/components/live-isolated-card';
import layout from '../templates/isolated';
import { computed } from '@ember/object';
import { equal, sort, not } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { task, waitForProperty } from 'ember-concurrency';

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
  store: service(),
  web3: service(),
  erc20: service(),
  isDismissed: false,
  activeSection: OVERVIEW,
  isOverviewActive: equal('activeSection.title', 'overview'),
  isAssetsSection: equal('activeSection.title', 'assets'),
  displaySections: SECTIONS,
  isListView: false,
  sortingOptions: SORTINGOPTIONS,
  selected: DEFAULTSORT,
  sortedAssets: sort('assets.[]', 'sortAssetsByBalance'),
  sortBy: 'networkBalance',
  metamaskWallet: null,
  assets: computed('content.wallets.[].network.assets.[]', function() {
    return this.store.peekAll('asset');
  }),
  loadingAssets: true,
  isWeb3Loaded: not('web3.isLoading'),

  async init() {
    this._super(arguments);

    if (this.web3.provider && this.web3.provider.isMetaMask) {
      await this.getMetamaskWallet.perform();
    }

    this.set('loadingAssets', false);
  },

  getMetamaskWallet: task(function * () {
    yield waitForProperty(this, 'isWeb3Loaded');

    let address = this.web3.address;
    let metamaskWallet = yield this.store.findRecord('wallet', 'metamask-wallet');

    this.set('metamaskWallet', metamaskWallet);

    yield this.getAssetsForWallet.perform(address);

    this.content.get('wallets').pushObject(this.get('metamaskWallet'));

    yield this.content.save();
  }),

  getAssetsForWallet: task(function * (address) {
    yield this.addAssetToWallet.perform(address, 'ether');

    for (let token of this.erc20.tokens()) {
      let tokenName = token.symbol.toLowerCase();
      let balanceOf;

      try {
        balanceOf = yield this.store.findRecord(`${tokenName}-token-balance-of`, address.toLowerCase());
      } catch (e) {
        return;
      }

      if (balanceOf) {
        yield this.addAssetToWallet.perform(`${address}_${tokenName}-token`, tokenName);
      }
    }
  }),

  addAssetToWallet: task(function * (assetId, networkId) {
    let asset;
    let network = yield this.store.findRecord('network', networkId);

    try {
      asset = yield this.store.findRecord('asset', assetId);
    } catch (e) {
      asset = this.store.createRecord('asset', {
        id: assetId,
        network,
        todaysRatesLookup: this.content.todaysRatesLookup
      });

      yield asset.save();
    }

    this.get('metamaskWallet.assets').pushObject(asset);
  }),

  isAscending: computed('selected', function() {
    let selection = this.selected;

    if (!selection || selection.id === 'descending') {
      return false;
    }

    return true;
  }),

  sortAssetsByBalance: computed('sortBy', 'isAscending', function() {
    let sortOrder = this.isAscending ? 'asc' : 'desc';
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
