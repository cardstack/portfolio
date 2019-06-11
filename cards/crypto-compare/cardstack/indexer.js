const { declareInjections } = require('@cardstack/di');
const Session = require('@cardstack/plugin-utils/session');
const log = require('@cardstack/logger')('portfolio/crypto-compare/indexer');
const moment = require('moment-timezone');

module.exports = declareInjections({
  searchers: 'hub:searchers',
}, class CryptoCompareIndexer {

  async beginUpdate() {
    return new Updater(this.searchers, this.dataSource.id, this.toFiatCurrencies, this.fromCryptoCurrencies);
  }
});

class Updater {
  constructor(searchers, dataSourceId, toFiatCurrencies, fromCryptoCurrencies) {
    this.searchers = searchers;
    this.dataSourceId = dataSourceId;
    this.toFiatCurrencies = toFiatCurrencies;
    this.fromCryptoCurrencies = fromCryptoCurrencies;
  }

  async schema() {
    return []; // our schema is static, so we're emitting it from the static-model.js feature
  }

  async updateContent(meta, hints, ops) {
    log.debug(`starting crypto-compare-current-rates indexing`);

    if (!this.fromCryptoCurrencies || !this.toFiatCurrencies) { return; }

    let today = moment().utc().format('YYYY-MM-DD');
    let rates = [];

    for (let fromCurrency of this.fromCryptoCurrencies) {
      for (let toCurrency of this.toFiatCurrencies) {
        let id = `${fromCurrency}_${toCurrency}_${today}`;
        await this.searchers.get(Session.INTERNAL_PRIVILEGED, 'local-hub', 'crypto-compares', id);
        rates.push({ type: 'crypto-compares', id });
      }
    }

    await ops.save('crypto-compare-current-rates', 'today', {
      data: {
        id: 'today',
        type: 'crypto-compare-current-rates',
        relationships: { rates: { data: rates } }
      }
    });

    log.debug(`completed crypto-compare-current-rates indexing`);
  }
}
