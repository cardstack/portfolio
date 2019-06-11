const { declareInjections } = require('@cardstack/di');
const Session = require('@cardstack/plugin-utils/session');
const Error = require('@cardstack/plugin-utils/error');
const { get } = require('lodash');
const moment = require('moment-timezone');
const fetch = require('node-fetch');
const log = require('@cardstack/logger')('portfolio/crypto-compare');

const aReallyLongTime = 60 * 60 * 24 * 365 * 10;
const centsMultiplier = {
  USD: 100,
  EUR: 100,
  GBP: 100,
  CHF: 100,
  JPY: 1,
  CNY: 1,
};

module.exports = declareInjections({
  searchers: 'hub:searchers'
},

class CryptoCompareSearcher {
  async get(session, type, id, next) {
    let result = await next();
    if (result) {
      return result;
    }

    if (type === 'crypto-compares') {
      return await this._lookupRateById(id);
    }
  }

  async search(session, query, next) {
    if (get(query, 'filter.type') === 'crypto-compares' ||
      get(query, 'filter.type.exact') === 'crypto-compares') {
      return await this._lookupRateByQuery(query);
    }

    return next();
  }

  async _lookupRateByQuery(query) {
    let fromCryptoCurrency = get(query, 'filter.from-crypto-currency.exact') || get(query, 'filter.from-crypto-currency');
    let toFiatCurrency = get(query, 'filter.to-fiat-currency.exact') || get(query, 'filter.to-fiat-currency');
    let date = get(query, 'filter.gmt-date.exact') || get(query, 'filter.gmt-date');
    if (!fromCryptoCurrency || !toFiatCurrency || !date) {
      return { data: [] };
    }

    let id = `${fromCryptoCurrency}_${toFiatCurrency}_${date}`;

    let rate;
    try {
      rate = await this.searchers.get(Session.INTERNAL_PRIVILEGED, 'local-hub', 'crypto-compares', id);
    } catch (err) {
      if (err.status !== 404) { throw err; }
    }
    if (!rate) {
      return { data: [] };
    }

    return { data: [ rate.data ] };
  }

  async _lookupRateById(id) {
    if (!this.toFiatCurrencies || !this.fromCryptoCurrencies) { return; }

    let [ fromCryptoCurrency, toFiatCurrency, date ] = id.split('_');
    if (!fromCryptoCurrency || !toFiatCurrency || !date) { return; }
    if (!this.toFiatCurrencies.includes(toFiatCurrency) ||
        !this.fromCryptoCurrencies.includes(fromCryptoCurrency)) { return; }

    if (!moment(date).isValid()) {
      log.info(`Request query specifies invalid date '${date}'`);
      return;
    }

    const gmtToday = moment.utc().startOf('day');
    if (moment.utc(date).isAfter(gmtToday)) {
      log.info(`Request query specifies a future GMT date '${date}'. Today in GMT is '${gmtToday.format('YYYY-MM-DD')}'`);
      return;
    }

    let timestamp = moment.utc(date).unix();
    let url = `${this.cryptoCompareDailyAverageApiUrl}?fsym=${fromCryptoCurrency}&tsym=${toFiatCurrency}&toTs=${timestamp}`;
    let responseBody;
    if (process.env.HUB_ENVIRONMENT === 'development' && !this.apiKey) {
      let basis = 100;
      let randomOffsetPercentage = 0.1;
      responseBody = {
        [toFiatCurrency]: basis - (Math.floor(Math.random() * Math.round(basis * randomOffsetPercentage)))
      };
    } else if ((!process.env.HUB_ENVIRONMENT || process.env.HUB_ENVIRONMENT === 'test') && !this.apiKey) {
      responseBody = {
        [toFiatCurrency]: 100
      };
    } else {
      let response = await fetch(`${url}&api_key=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`Could not get crypto currency rate for URL ${url}: ${response.statusText}`, response.status);
      }
      responseBody = await response.json();
    }

    let cents = Math.round(responseBody[toFiatCurrency] * (centsMultiplier[toFiatCurrency] || 100));

    return {
      data: {
        type: 'crypto-compares',
        id,
        attributes: {
          'from-crypto-currency': fromCryptoCurrency,
          'to-fiat-currency': toFiatCurrency,
          'gmt-date': date,
          cents
        }
      },
      meta: {
        'cardstack-cache-control': { 'max-age': aReallyLongTime }
      }
    };
  }
});
