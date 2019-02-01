
// Note this relies on fields defined by either the real ethereum datasource or the mock ethereum data source
module.exports = [{
  type: "fields",
  id: "mock-address",
  attributes: {
    "field-type": "@cardstack/core-types::case-insensitive"
  }
}, {
  type: 'content-types',
  id: 'mock-transactions',
  attributes: {
    defaultIncludes: [
      'rates-at-transaction-timestamp',
      'to-address',
      'from-address'
    ],
    fieldsets: {
      embedded: [
        { field: 'rates-at-transaction-timestamp', format: 'embedded' },
        { field: 'to-address', format: 'embedded' },
        { field: 'from-address', format: 'embedded' },
      ],
      isolated: [
        { field: 'rates-at-transaction-timestamp', format: 'embedded' },
        { field: 'to-address', format: 'embedded' },
        { field: 'from-address', format: 'embedded' },
      ]
    }
  },
  relationships: {
    fields: {
      data: [
        { type: "fields", id: "block-number" },
        { type: "fields", id: "timestamp" },
        { type: "fields", id: "transaction-hash" },
        { type: "fields", id: "block-hash" },
        { type: "fields", id: "transaction-nonce" },
        { type: "fields", id: "transaction-index" },
        { type: "fields", id: "to-address" },
        { type: "fields", id: "from-address" },
        { type: "fields", id: "transaction-value" },
        { type: "fields", id: "transaction-from" },
        { type: "fields", id: "transaction-to" },
        { type: "fields", id: "gas" },
        { type: "fields", id: "gas-price" },
        { type: "fields", id: "transaction-data" },
        { type: "fields", id: "transaction-successful" },
        { type: "fields", id: "gas-used" },
        { type: "fields", id: "cumulative-gas-used" },
        { type: "computed-fields", id: "rates-at-transaction-timestamp" },
      ]
    },
  }
}, {
  type: 'content-types',
  id: 'mock-addresses',
  attributes: {
    'default-includes': ['transactions'],
    fieldsets: {
      embedded: [
        { field: 'transactions', format: 'embedded' },
      ],
      isolated: [
        { field: 'transactions', format: 'embedded' },
      ],
    }
  },
  relationships: {
    fields: {
      data: [
        { type: "fields", id: "mock-address" }, // use this field to preserve the case of the ID to faithfully represent EIP-55 encoding
        { type: "fields", id: "balance" },
        { type: "fields", id: "transactions" },
      ]
    },
  }
}, {
  type: 'grants',
  id: 'mock-address-indexing-grant',
  attributes: {
    'may-read-fields': true,
    'may-read-resource': true,
  },
  relationships: {
    who: {
      data: [{ type: 'groups', id: 'everyone' }]
    },
    types: {
      "data": [
        { type: "content-types", id: 'mock-addresses' },
        { type: "content-types", id: 'mock-transactions' }
      ]
    }
  }
}];
