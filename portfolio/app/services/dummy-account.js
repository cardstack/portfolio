import Service from '@ember/service';
import { convertCurrency } from 'portfolio-common/helpers/convert-currency';

export default Service.extend({
  init() {
    this._super();
    this.values = new WeakMap();
  },

  balanceFor(wallet, { asset, inCurrency }) {
    if (!wallet) { return; }
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
        // ETH assets are linked to the actual ETH wallet address
        value = networkAsset ? networkAsset.balance : "0";
      } else {
        let valueForAsset = walletAssets.get(asset);
        // we'd already created a random value for this asset
        if (valueForAsset) {
          continue;
        }
        value = this._randomBalance(crypto);
      }
      walletAssets.set(asset, { crypto, value });
    }
  },

  _randomBalance(crypto) {
    let randomGenerators = {
      "BTC": () => {
        let range = Math.pow(10, 5);
        return Math.round(Math.random() * range) / range;
      },
      "LTC": () => {
        let range = Math.pow(10, 6);
        return Math.round(Math.random() * range) / range;
      },
      "ZEC": () => {
        let range = Math.pow(10, 6);
        return Math.round(Math.random() * range) / range;
      }
    }
    switch(crypto) {
      case "ETH":
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
