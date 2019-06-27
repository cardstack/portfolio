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
  cardstackData: service(),
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
  assets: computed('content.wallets.[].assets.[]', function() {
    return this.get('content.wallets.firstObject.assets');
  }),
  loadingAssets: true,
  isWeb3Loaded: not('web3.isLoading'),

  async init() {
    this._super(arguments);

    if (this.web3.provider && this.web3.provider.isMetaMask) {
      await waitForProperty(this, 'isWeb3Loaded');
      let address = this.web3.address;
      await this.getPortfolio.perform(address);
    }

    this.set('loadingAssets', false);
  },

  getPortfolio: task(function * (address) {
    let portfolio;
    try {
      portfolio = yield this.store.findRecord('portfolio', `${address}`);
    } catch (e) {
      portfolio = this.store.createRecord('portfolio', {
        id: address,
        title: 'My Portfolio'
      });

      yield portfolio.save();
    }

    this.set('content', portfolio);

    yield this.getMetamaskWallet.perform(address);
  }),

  getMetamaskWallet: task(function * (address) {
    let metamaskWallet;
    try {
      metamaskWallet = yield this.store.findRecord('wallet', `${address}`);
    } catch (e) {
      yield this.createWalletAndAssets.perform(address);

      metamaskWallet = yield this.store.findRecord('wallet', `${address}`);
    }

    this.content.get('wallets').pushObject(metamaskWallet);

    yield this.content.save();
  }),

  createWalletAndAssets: task(function * (address) {
    let adapter = this.store.adapterFor('asset');

    let response = yield fetch(`${adapter.host}/create-wallet/${address}`, {
      method: 'POST',
      headers: {
        "content-type": 'application/vnd.api+json'
      },
      body: ""
    });

    let body = yield response.json();

    if (response.status === 200) {
      this.store.pushPayload('asset', body);
    }
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
