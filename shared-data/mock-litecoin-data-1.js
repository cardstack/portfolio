// These look and work like ethereum models because that's the only real type of
// crypto data that we have built out so far. Eventually these can act different
// after we build out more of the cypto indexers.

const { updateBalanceFromTransaction } = require('portfolio-utils');
const { utils: { BN } } = require('web3');

const assetId = 'LXA3i9eEAVDbgDqkThCa4D6BUJ3SEULkEr';
const networkHashSuffix = '_ltc';

let models = [
  {
    "id": assetId.toLowerCase(),
    "type": "mock-addresses",
    "attributes": {
      // "balance": "200895000000000000", // to be derived based on the transactions so the data stays consistent
      "mock-address": assetId,
    },
    "relationships": {
      "transactions": {
        "data": [
          {
            "id": `0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572${networkHashSuffix}`,
            "type": "mock-transactions"
          },
          {
            "id": `0x6efc3a61e5fac700a8d992f4bad4bfa62763601b05b04d27f2f96607ce097259${networkHashSuffix}`,
            "type": "mock-transactions"
          },
          {
            "id": `0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2${networkHashSuffix}`,
            "type": "mock-transactions"
          },
          {
            "id": `0xe65061bd5f9733d7213f893171075d4cb5cf2ce77fb1b0dbb0ac5a94eb84bf65${networkHashSuffix}`,
            "type": "mock-transactions"
          }
        ]
      }
    },
  },
  {
    "id": `0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572${networkHashSuffix}`,
    "type": "mock-transactions",
    "attributes": {
      "transaction-successful": true,
      "transaction-index": 17,
      "cumulative-gas-used": 21000,
      "transaction-data": "0x0",
      "timestamp": 1547478615,
      "transaction-nonce": 17,
      "block-number": 6,
      "gas-used": 21000,
      "transaction-from": "0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5",
      "block-hash": "0x62c48a107a96894248726dba13d114a1760fa9eef5370e98a0651ccb0ba0c41f",
      "transaction-to": assetId.toLowerCase(),
      "gas-price": "5000000000",
      "transaction-hash": `0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572${networkHashSuffix}`,
      "gas": 90000,
      "transaction-value": "192100000000000000"
    },
    "relationships": {
      "from-address": {
        "data": {
          "id": "0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5",
          "type": "mock-addresses"
        }
      },
      "to-address": {
        "data": {
          "id": assetId.toLowerCase(),
          "type": "mock-addresses"
        }
      }
    },
  },
  {
    "id": `0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2${networkHashSuffix}`,
    "type": "mock-transactions",
    "attributes": {
      "transaction-successful": true,
      "transaction-index": 23,
      "cumulative-gas-used": 21000,
      "transaction-data": "0x0",
      "timestamp":1547510400,
      "transaction-nonce": 8,
      "block-number": 8,
      "gas-used": 21000,
      "transaction-from": assetId.toLowerCase(),
      "block-hash": "0x4abacac4089661d1ba407ff4286f768bdaa58a95a7db5770b15a6f6bb1843af6",
      "transaction-to": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
      "gas-price": "5000000000",
      "transaction-hash": `0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2${networkHashSuffix}`,
      "gas": 90000,
      "transaction-value": "100000000000000000"
    },
    "relationships": {
      "from-address": {
        "data": {
          "id": assetId.toLowerCase(),
          "type": "mock-addresses"
        }
      },
      "to-address": {
        "data": {
          "id": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
          "type": "mock-addresses"
        }
      }
    },
  },
  {
    "id": `0x6efc3a61e5fac700a8d992f4bad4bfa62763601b05b04d27f2f96607ce097259${networkHashSuffix}`,
    "type": "mock-transactions",
    "attributes": {
      "transaction-successful": false,
      "transaction-index": 37,
      "cumulative-gas-used": 21000,
      "transaction-data": "0x0",
      "timestamp": 1547511400,
      "transaction-nonce": 32,
      "block-number": 9,
      "gas-used": 21000,
      "transaction-from": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
      "block-hash": "0xa8e29d6436116184de229b501854e502009669985724ce53e8c240cfe43ef1e4",
      "transaction-to": assetId.toLowerCase(),
      "gas-price": "5000000000",
      "transaction-hash": `0x6efc3a61e5fac700a8d992f4bad4bfa62763601b05b04d27f2f96607ce097259${networkHashSuffix}`,
      "gas": 90000,
      "transaction-value": "100000000000000000"
    },
    "relationships": {
      "from-address": {
        "data": {
          "id": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
          "type": "mock-addresses"
        }
      },
      "to-address": {
        "data": {
          "id": assetId.toLowerCase(),
          "type": "mock-addresses"
        }
      }
    },
  },
  {
    "id": `0xe65061bd5f9733d7213f893171075d4cb5cf2ce77fb1b0dbb0ac5a94eb84bf65${networkHashSuffix}`,
    "type": "mock-transactions",
    "attributes": {
      "transaction-successful": true,
      "transaction-index": 47,
      "cumulative-gas-used": 21000,
      "transaction-data": "0x0",
      "timestamp": 1547769600,
      "transaction-nonce": 89,
      "block-number": 10,
      "gas-used": 21000,
      "transaction-from": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
      "block-hash": "0x912f10b233bbdca5bb318ce4978881906b60c1444870b8a7457a3d1d3c6de9a9",
      "transaction-to": assetId.toLowerCase(),
      "gas-price": "5000000000",
      "transaction-hash": `0xe65061bd5f9733d7213f893171075d4cb5cf2ce77fb1b0dbb0ac5a94eb84bf65${networkHashSuffix}`,
      "gas": 90000,
      "transaction-value": "100000000000000000"
    },
    "relationships": {
      "from-address": {
        "data": {
          "id": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
          "type": "mock-addresses"
        }
      },
      "to-address": {
        "data": {
          "id": assetId.toLowerCase(),
          "type": "mock-addresses"
        }
      }
    },
  }
];

let address = models.find(i => i.type === 'mock-addresses');
let balance = models.filter(i => i.type === 'mock-transactions')
  .reduce((cumulativeBalance, txn) => updateBalanceFromTransaction(cumulativeBalance, address.id, txn), new BN(0));

address.attributes.balance = balance.toString();

module.exports = models;