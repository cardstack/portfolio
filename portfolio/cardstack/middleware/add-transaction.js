const { declareInjections } = require('@cardstack/di');
const { get } = require('lodash');
const { utils: { BN } } = require('web3');
const Session = require('@cardstack/plugin-utils/session');
const parse = require('co-body');
const { updateBalanceFromTransaction } = require('portfolio-utils');
const moment = require('moment-timezone');

module.exports = declareInjections({
  searchers: 'hub:searchers',
  writers: 'hub:writers'
},

class AddMockTransaction {
  middleware() {
    return async (ctxt, next) => {
      if (ctxt.request.path !== '/mock-transaction' ||
        ctxt.request.method !== 'POST' ||
        process.env.HUB_ENVIRONMENT === 'production') {
        return next();
      }
      let body = await parse(ctxt.req);
      let attributes = get(body, 'data.attributes');
      let fromAddress = attributes['transaction-from'];
      let toAddress = attributes['transaction-to'];
      let txnHash = attributes['transaction-hash'];
      let value = attributes['transaction-value'];
      let gasPrice = attributes['gas-used'];
      let gasUsed = attributes['gas-price'];
      let blockNumber = attributes['block-number'];
      attributes.timestamp = moment().utc().unix();

      if (!fromAddress || !txnHash || !value || !gasPrice || !gasUsed || !blockNumber) {
        ctxt.status = 400;
        return;
      }

      let fromModel, toModel;
      try {
        fromModel = await this.searchers.search(Session.INTERNAL_PRIVILEGED, 'local-hub', 'ethereum-addresses', fromAddress.toLowerCase());
      } catch (e) {
        if (e.status !== 404) {
          ctxt.status = 400;
          return;
        }
      }
      if (toAddress) {
        try {
          toModel = await this.searchers.search(Session.INTERNAL_PRIVILEGED, 'local-hub', 'ethereum-addresses', toAddress.toLowerCase());
        } catch (e) {
          if (e.status !== 404) {
            ctxt.status = 400;
            return;
          }
        }
      }

      if (!fromModel && !toModel) {
        ctxt.status = 403;
        return;
      }

      let transaction = await this.writers.create(Session.INTERNAL_PRIVILEGED, 'ethereum-transactions', {
        data: {
          id: txnHash,
          type: 'ethereum-transactions',
          attributes
        }
      });

      if (fromModel) {
        let transactions = get(fromModel, 'data.relationships.transactions.data') || [];
        transactions.push({ type: 'ethereum-transactions', id: txnHash });
        fromModel.relationships.transactions.data = transactions;
        let transactionModels = fromModel.included.filter(i => i.type === 'ethereum-transactions').concat([transaction.data]);
        let balance = transactionModels
          .reduce((cumulativeBalance, txn) => updateBalanceFromTransaction(cumulativeBalance, fromAddress.toLowerCase(), txn), new BN(0));
        fromModel.data.attributes.balance = balance.toString();
        await this.writers.update(Session.INTERNAL_PRIVILEGED, 'ethereum-addresses', fromAddress.toLowerCase(), fromModel);
      }
      if (toModel) {
        let transactions = get(toModel, 'data.relationships.transactions.data') || [];
        transactions.push({ type: 'ethereum-transactions', id: txnHash });
        toModel.data.relationships.transactions.data = transactions;
        let transactionModels = toModel.included.filter(i => i.type === 'ethereum-transactions').concat([transaction.data]);
        let balance = transactionModels
          .reduce((cumulativeBalance, txn) => updateBalanceFromTransaction(cumulativeBalance, toAddress.toLowerCase(), txn), new BN(0));
        toModel.data.attributes.balance = balance.toString();
        await this.writers.update(Session.INTERNAL_PRIVILEGED, 'ethereum-addresses', toAddress.toLowerCase(), toModel);
      }

      ctxt.status = 201;
      ctxt.body = transaction;
    };
  }
});