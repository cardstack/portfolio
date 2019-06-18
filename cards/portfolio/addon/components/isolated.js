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
    let metamaskWallet;
    try {
      metamaskWallet = yield this.store.findRecord('wallet', `metamask-${address}`);
    } catch (e) {
      metamaskWallet = this.store.createRecord('wallet', {
        id: `metamask-${address}`,
        title: 'Metamast Wallet'
      });

      yield metamaskWallet.save();
      this.set('metamaskWallet', metamaskWallet);

      yield this.addAssetToWallet.perform(address, 'ether');

      let tokenBalances = yield metamaskWallet.tokenBalances;
      let tokenNames = tokenBalances.toArray().map(balance => balance.type.split('-')[0]);

      yield this.addTokensToWallet.perform(address, tokenNames);
    }


    this.content.get('wallets').pushObject(metamaskWallet);

    yield this.content.save();
  }),

  addAssetToWallet: task(function * (assetId, networkId) {
    let asset;
    let network = yield this.store.findRecord('network', networkId);

    try {
      asset = yield this.store.findRecord('asset', assetId);
    } catch (e) {
      asset = this.store.createRecord('asset', {
        id: assetId,
        network
      });

      yield asset.save();
    }

    this.get('metamaskWallet.assets').pushObject(asset);
  }),

  addTokensToWallet: task(function * (address, tokenNames) {
    let adapter = this.store.adapterFor('asset');

    let data = tokenNames.map(token => {
      return {
        type: 'assets',
        id: `${address}_${token}-token`,
        relationships: {
          network: { data: { type: 'networks', id: token } }
        }
      }
    });

    let response = yield fetch(`${adapter.host}/token-assets`, {
      method: 'POST',
      headers: {
        "content-type": 'application/vnd.api+json'
      },
      body: JSON.stringify({ data })
    });

    let body = yield response.json();

    if (response.status === 200) {
      this.store.pushPayload('asset', body);

      let assetIds = tokenNames.map(token => `${address}_${token}-token`);
      let query = {
        filter: {
          type: { exact: 'assets' },
          id: { exact: assetIds }
        }
      };

      let assets = yield this.cardstackData.query('embedded', query);
      let metamaskWallet = this.get('metamaskWallet');

      metamaskWallet.get('assets').pushObjects(assets);
      yield metamaskWallet.save();
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
