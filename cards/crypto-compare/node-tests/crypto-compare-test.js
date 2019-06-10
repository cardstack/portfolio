const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
const {
  createDefaultEnvironment,
  destroyDefaultEnvironment
} = require('@cardstack/test-support/env');
const nock = require('nock');
const sleep = require('util').promisify(setTimeout);
const { join } = require('path');
const { readdirSync, existsSync } = require('fs');
const moment = require('moment-timezone');
const {
  BTC_USD_1514764800,
  BTC_EUR_1514764800,
  ETH_USD_1514764800,
  ETH_EUR_1514764800,
} = require('./fixtures/crypto-compare-responses');

const cardDir = join(__dirname, '../../');
const cryptoCompareHost = 'https://min-api.cryptocompare.com';
const cryptoComparePath = `/data/dayAvg`;
const cryptoCompareUrl = `${cryptoCompareHost}${cryptoComparePath}`;

let factory, env, searchers, now;
let toCurrencies = ['USD', 'EUR'];
let fromCurrencies = ['BTC', 'ETH'];

describe('crypto-compare', function () {
  beforeEach(async function () {
    factory = new JSONAPIFactory();

    factory.addResource('data-sources', 'crypto-compare')
      .withAttributes({
        sourceType: 'portfolio-crypto-compare',
        params: {
          'cryptoCompareDailyAverageApiUrl': cryptoCompareUrl,
          'apiKey': 'TEST_KEY',
          'toFiatCurrencies': toCurrencies,
          'fromCryptoCurrencies': fromCurrencies
        }
      });

    // Make all content types available from the cards in our application available for us to use
    for (let cardName of readdirSync(cardDir)) {
      let schemaFile = join(cardDir, cardName, 'cardstack', 'static-model.js');
      if (!existsSync(schemaFile)) { continue; }
      factory.importModels(require(schemaFile)());
    }

    // setup nocks for the indexer
    now = moment.utc();
    const expectedTimestamp = now.startOf('day').unix();
    for (let fromCurrency of fromCurrencies) {
      for (let toCurrency of toCurrencies) {
        nock(cryptoCompareHost)
          .get(`${cryptoComparePath}?fsym=${fromCurrency}&tsym=${toCurrency}&toTs=${expectedTimestamp}&api_key=TEST_KEY`)
          .reply(200, ETH_EUR_1514764800);
      }
    }

    env = await createDefaultEnvironment(`${__dirname}/..`, factory.getModels());
    searchers = env.lookup('hub:searchers');
  });

  afterEach(async function () {
    await destroyDefaultEnvironment(env);
  });

  describe('indexer', function () {
    it('creates a crypto-compare-current-rates/today resource when the indexers update', async function() {
      const today = now.format('YYYY-MM-DD');

      let { data, included } = await searchers.get(env.session, 'local-hub', 'crypto-compare-current-rates', 'today');

      let rates = data.relationships.rates.data;
      expect(rates).to.have.deep.members([
        { type: 'crypto-compares', id: `BTC_USD_${today}` },
        { type: 'crypto-compares', id: `ETH_USD_${today}` },
        { type: 'crypto-compares', id: `BTC_EUR_${today}` },
        { type: 'crypto-compares', id: `ETH_EUR_${today}` },
      ]);

      let includedRates = included.map(i => `${i.type}/${i.id}`);
      expect(includedRates).to.have.members([
        `crypto-compares/BTC_USD_${today}`,
        `crypto-compares/ETH_USD_${today}`,
        `crypto-compares/BTC_EUR_${today}`,
        `crypto-compares/ETH_EUR_${today}`,
      ]);
    });
  });

  describe('searcher', function () {
    it('can search for a historical conversion rate (Daily Volume Weighted Average Price based on GMT timezone) for supported crypto and fiat currencies', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=USD&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_USD_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: 'crypto-compares',
          'from-crypto-currency': { exact: 'BTC' },
          'to-fiat-currency': { exact: 'USD' },
          'gmt-date': { exact: '2018-01-01' }
        }
      });

      expect(results.length).to.equal(1);
      let [ result ] = results;
      expect(result).to.have.property('id', 'BTC_USD_2018-01-01')
      expect(result).to.have.property('type', 'crypto-compares');
      expect(result).to.have.deep.property('attributes.from-crypto-currency', 'BTC');
      expect(result).to.have.deep.property('attributes.to-fiat-currency', 'USD');
      expect(result).to.have.deep.property('attributes.gmt-date', '2018-01-01');
      expect(result).to.have.deep.property('attributes.cents', 1340661);
    });

    it('can search for a historical conversion rate without having to use `exact` in query', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'BTC',
          'to-fiat-currency': 'EUR',
          'gmt-date': '2018-01-01'
        }
      });

      expect(results.length).to.equal(1);
      let [ result ] = results;
      expect(result).to.have.property('id', 'BTC_EUR_2018-01-01')
      expect(result).to.have.property('type', 'crypto-compares');
      expect(result).to.have.deep.property('attributes.from-crypto-currency', 'BTC');
      expect(result).to.have.deep.property('attributes.to-fiat-currency', 'EUR');
      expect(result).to.have.deep.property('attributes.gmt-date', '2018-01-01');
      expect(result).to.have.deep.property('attributes.cents', 1143531);
    });

    it('can get a historical conversion rate by id', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=ETH&tsym=USD&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, ETH_USD_1514764800);

      let { data: result } = await searchers.get(env.session, 'local-hub', 'crypto-compares', 'ETH_USD_2018-01-01');

      expect(result).to.have.property('id', 'ETH_USD_2018-01-01')
      expect(result).to.have.property('type', 'crypto-compares');
      expect(result).to.have.deep.property('attributes.from-crypto-currency', 'ETH');
      expect(result).to.have.deep.property('attributes.to-fiat-currency', 'USD');
      expect(result).to.have.deep.property('attributes.gmt-date', '2018-01-01');
      expect(result).to.have.deep.property('attributes.cents', 74823);
    });

    it('retrieves conversion rate at 0:00 GMT of the day requested', async function() {
      const now = moment.utc();
      const date = now.format('YYYY-MM-DD');
      const expectedTimestamp = now.startOf('day').unix();
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=ETH&tsym=EUR&toTs=${expectedTimestamp}&api_key=TEST_KEY`)
        .reply(200, ETH_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'ETH',
          'to-fiat-currency': 'EUR',
          'gmt-date': date
        }
      });

      expect(results.length).to.equal(1);
      let [ result ] = results;
      expect(result).to.have.property('id', `ETH_EUR_${date}`);
      expect(result).to.have.property('type', 'crypto-compares');
      expect(result).to.have.deep.property('attributes.from-crypto-currency', 'ETH');
      expect(result).to.have.deep.property('attributes.to-fiat-currency', 'EUR');
      expect(result).to.have.deep.property('attributes.gmt-date', date);
      expect(result).to.have.deep.property('attributes.cents', 63980);
    });

    it('caches values from crypto-compare', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=ETH&tsym=USD&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, ETH_USD_1514764800);

      await searchers.get(env.session, 'local-hub', 'crypto-compares', 'ETH_USD_2018-01-01');

      await sleep(5000);

      // expect this to not throw error since nock instantiates only 1 interceptor for the crypto compare HTTP request
      await searchers.get(env.session, 'local-hub', 'crypto-compares', 'ETH_USD_2018-01-01');
    });

    it('does not retrieve non-supported crypto currency', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'XRP',
          'to-fiat-currency': 'EUR',
          'gmt-date': '2018-01-01'
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', 'XRP_USD_2018-01-01');
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not retrieve non-supported fiat currency', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'BTC',
          'to-fiat-currency': 'GBP',
          'gmt-date': '2018-01-01'
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', 'BTC_GBP_2018-01-01');
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not retrieve conversion rates for future dates', async function() {
      const tomorrow = moment.utc().add(1, 'day').format('YYYY-MM-DD');
      const todayAsTimestamp = moment.utc().startOf('day').unix();
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=${todayAsTimestamp}&api_key=TEST_KEY`)
        .reply(200, ETH_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'BTC',
          'to-fiat-currency': 'EUR',
          'gmt-date': tomorrow
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', `BTC_EUR_${tomorrow}`);
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not retrieve conversion rates for badly formatted date', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'BTC',
          'to-fiat-currency': 'EUR',
          'gmt-date': 'not-a-date'
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', 'BTC_EUR_not-a-date');
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not retrieve conversion rates searches missing fiat currency term', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'from-crypto-currency': 'BTC',
          'gmt-date': '2018-01-01'
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', 'BTC_2018-01-01');
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not retrieve conversion rates searches missing crypto currency term', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'to-fiat-currency': 'EUR',
          'gmt-date': '2018-01-01'
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', 'EUR_2018-01-01');
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

    it('does not retrieve conversion rates searches missing date term', async function() {
      nock(cryptoCompareHost)
        .get(`${cryptoComparePath}?fsym=BTC&tsym=EUR&toTs=1514764800&api_key=TEST_KEY`)
        .reply(200, BTC_EUR_1514764800);

      let { data: results } = await searchers.search(env.session, {
        filter: {
          type: { exact: 'crypto-compares' },
          'to-fiat-currency': 'EUR',
          'from-crypto-currency': 'BTC',
        }
      });
      expect(results.length).to.equal(0);

      let error;
      try {
        await searchers.get(env.session, 'local-hub', 'crypto-compares', 'BTC_EUR');
      } catch (e) {
        error = e;
      }
      expect(error.status).to.equal(404);
    });

  });

});