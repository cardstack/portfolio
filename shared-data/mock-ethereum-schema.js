module.exports = [{
  type: "fields",
  id: "ethereum-address",
  attributes: {
    "field-type": "@cardstack/core-types::case-insensitive"
  }
}, {
  type: "fields",
  id: "block-number",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "event-name",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "mapping-boolean-value",
  attributes: {
    "field-type": "@cardstack/core-types::boolean"
  }
}, {
  type: "fields",
  id: "mapping-string-value",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "mapping-address-value",
  attributes: {
    "field-type": "@cardstack/core-types::case-insensitive"
  }
}, {
  type: "fields",
  id: "mapping-number-value",
  attributes: {
    "field-type": "@cardstack/core-types::string" // ethereum numbers are too large for JS, use a string to internally represent ethereum numbers
  }
}, {
  type: "fields",
  id: "transaction-hash",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "block-hash",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "transaction-nonce",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "transaction-index",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "timestamp",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "transaction-value",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "gas",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "gas-price",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "transaction-data",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "balance",
  attributes: {
    "field-type": "@cardstack/core-types::string"
  }
}, {
  type: "fields",
  id: "transaction-successful",
  attributes: {
    "field-type": "@cardstack/core-types::boolean"
  }
}, {
  type: "fields",
  id: "transaction-from",
  attributes: {
    "field-type": "@cardstack/core-types::case-insensitive"
  }
}, {
  type: "fields",
  id: "transaction-to",
  attributes: {
    "field-type": "@cardstack/core-types::case-insensitive"
  }
}, {
  type: "fields",
  id: "gas-used",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "cumulative-gas-used",
  attributes: {
    "field-type": "@cardstack/core-types::integer"
  }
}, {
  type: "fields",
  id: "to-address",
  attributes: {
    "field-type": "@cardstack/core-types::belongs-to"
  },
}, {
  type: "fields",
  id: "from-address",
  attributes: {
    "field-type": "@cardstack/core-types::belongs-to"
  },
}, {
  type: "fields",
  id: "transactions",
  attributes: {
    "field-type": "@cardstack/core-types::has-many"
  },
}, {
  type: 'content-types',
  id: 'ethereum-transactions',
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
  id: 'ethereum-addresses',
  attributes: {
    // cards should patch this schema in the data-source config for setting the fieldsets based on their specific scenarios
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
        { type: "fields", id: "ethereum-address" }, // use this field to preserve the case of the ID to faithfully represent EIP-55 encoding
        { type: "fields", id: "balance" },
        { type: "fields", id: "transactions" },
      ]
    },
  }
}, {
  type: 'grants',
  id: 'ethereum-address-indexing-grant',
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
        { type: "content-types", id: 'ethereum-addresses' },
        { type: "content-types", id: 'ethereum-transactions' }
      ]
    }
  }
}];
