const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

factory.addResource('data-sources', 'asset-history')
  .withAttributes({
    sourceType: 'portfolio-asset-history',
    params: {
      assetContentTypes: ['ethereum-addresses'],
      transactionContentTypes: ['ethereum-transactions'],
      // FYI: mockNow is available in test environment which is quite handy when you need to control what "now" is
      // mockNow: moment('2019-01-20', 'YYYY-MM-DD').utc().valueOf()
    }
  });

module.exports = factory.getModels();