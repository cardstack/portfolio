import Ember from 'ember';
import Service from '@ember/service';
import { convertCurrency } from 'portfolio-common/helpers/convert-currency';

function findStoredValue(asset) {
  let key = asset.id;
  let portfolioBalances = localStorage.getItem('cs-portfolio-balances');
  if (!portfolioBalances) {
    return;
  }
  portfolioBalances = JSON.parse(portfolioBalances);
  return portfolioBalances[key];
}

function storeValue(asset, value) {
  let key = asset.id;
  let portfolioBalances = localStorage.getItem('cs-portfolio-balances');
  let newBalances = {};
  if (portfolioBalances) {
    newBalances = JSON.parse(portfolioBalances);
  }
  newBalances[key] = value;
  localStorage.setItem('cs-portfolio-balances', JSON.stringify(newBalances));
}

export default Service.extend({
  init() {
    this._super();
    this.values = new WeakMap();
  },

  balanceFor(wallet, { asset, inCurrency }) {
    if (!wallet) { return; }
    if (Ember.testing) { return 0; }
    this._generateValuesForWallet(wallet);
    return this._valueFor(wallet, { asset, inCurrency });
  },

  _valueFor(wallet, { asset, inCurrency }) {
    let walletValues = this.values.get(wallet);
    if (asset) {
      let { value } = walletValues.get(asset);
      return inCurrency ? this._convertToFiat(wallet, asset.networkUnit, inCurrency, value) : value;
    }

    let total = 0;
    for (let { crypto, value } of walletValues.values()) {
      let converted = this._convertToFiat(wallet, crypto, inCurrency, value);
      total += parseFloat(converted || 0);
    }
    return total;
  },

   _generateValuesForWallet(wallet) {
    if (!this.values.has(wallet)) {
      this.values.set(wallet, new Map());
    }
    let walletAssets = this.values.get(wallet);
    let assets = wallet.get('assets').toArray();
    for (let asset of assets) {
      let crypto = asset.get('networkUnit');
      let networkAsset = asset.get('networkAsset');
      let value;
      if (crypto === 'ETH') {
        // ETH assets are linked to the actual ETH wallet address,
        // so let's not mess with them
        value = networkAsset ? networkAsset.balance : "0";
      } else {
        let valueForAsset = walletAssets.get(asset);
        // we'd already created a random value for this asset
        if (valueForAsset) {
          continue;
        }
        value = findStoredValue(asset);
        if (!value) {
          value = this._generateAndStoreValue(asset);
        }
      }
      walletAssets.set(asset, { crypto, value });
    }
  },

  _generateAndStoreValue(asset) {
    let crypto = asset.get('networkUnit');
    let value = this._randomBalance(crypto);
    storeValue(asset, value);
    return value;
  },

  _randomBalance(crypto) {
    let randomGenerators = {
      "BTC": () => {
        let range = Math.pow(10, 4);
        let value = Math.random() + 0.5;
        return Math.round(value * range) / range;
      },
      "LTC": () => {
        let range = Math.pow(10, 3);
        let value = Math.random() * 10 + 2;
        return Math.round(value * range) / range;
      },
      "ZEC": () => {
        let range = Math.pow(10, 3);
        let value = Math.random() * 10 + 2;
        return Math.round(value * range) / range;
      }
    }
    return randomGenerators[crypto]();
  },

  _convertToFiat(wallet, crypto, fiat, value) {
    // All assets have the same `rates` on them, so we take the first
    let { rates } = wallet.get('assets').firstObject.todaysRatesLookup;
    return convertCurrency(crypto, fiat, value, rates);
  },

  _assetKey(asset) {
    return asset.id;
  }
});
