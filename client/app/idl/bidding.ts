/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/bidding.json`.
 */
export type Bidding = {
  "address": "D7rhKbV2vR28tjtKEf7w1dk3TdyFmDKq2GouMHcSJSGs",
  "metadata": {
    "name": "bidding",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "bid",
      "discriminator": [
        199,
        56,
        85,
        38,
        146,
        243,
        37,
        158
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "itemAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109
                ]
              },
              {
                "kind": "arg",
                "path": "itemId"
              }
            ]
          }
        },
        {
          "name": "escrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "item_account.authority",
                "account": "item"
              },
              {
                "kind": "arg",
                "path": "itemId"
              }
            ]
          }
        },
        {
          "name": "previousBidder",
          "docs": [
            "We verify this matches the address stored in the item_account."
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "itemId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializeCounter",
      "discriminator": [
        67,
        89,
        100,
        87,
        231,
        172,
        35,
        124
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "itemCounterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeItem",
      "discriminator": [
        56,
        205,
        178,
        170,
        150,
        105,
        174,
        27
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "itemCounterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "itemAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "item_counter_account.item_count",
                "account": "itemCounter"
              }
            ]
          }
        },
        {
          "name": "escrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "item_counter_account.item_count",
                "account": "itemCounter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "imageUrl",
          "type": "string"
        },
        {
          "name": "openingPrice",
          "type": "u64"
        },
        {
          "name": "minimumBid",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferItemToWinner",
      "discriminator": [
        119,
        159,
        168,
        32,
        157,
        217,
        16,
        104
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "auctionCreator",
          "docs": [
            "We verify this matches the address stored in the item_account."
          ],
          "writable": true
        },
        {
          "name": "itemAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109
                ]
              },
              {
                "kind": "arg",
                "path": "itemId"
              }
            ]
          }
        },
        {
          "name": "escrowAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "item_account.authority",
                "account": "item"
              },
              {
                "kind": "arg",
                "path": "itemId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "itemId",
          "type": "u16"
        },
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "item",
      "discriminator": [
        92,
        157,
        163,
        130,
        72,
        254,
        86,
        216
      ]
    },
    {
      "name": "itemCounter",
      "discriminator": [
        172,
        224,
        3,
        83,
        152,
        26,
        95,
        17
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPreviousBidder",
      "msg": "The provided previous bidder does not match the stored highest bidder."
    },
    {
      "code": 6001,
      "name": "previousBidderNotWritable",
      "msg": "The previous bidder account must be writable to receive the refund."
    },
    {
      "code": 6002,
      "name": "escrowNotRentExempt",
      "msg": "The escrow account would not remain rent exempt after the refund."
    },
    {
      "code": 6003,
      "name": "invalidNewAuthority",
      "msg": "The winner is not valid"
    },
    {
      "code": 6004,
      "name": "invalidAuctionCreator",
      "msg": "The auction creator is not valid"
    }
  ],
  "types": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "item",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "openingPrice",
            "type": "u64"
          },
          {
            "name": "itemId",
            "type": "u16"
          },
          {
            "name": "highestBid",
            "type": "u64"
          },
          {
            "name": "minimumBid",
            "type": "u64"
          },
          {
            "name": "highestBidder",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "itemCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "itemCount",
            "type": "u16"
          }
        ]
      }
    }
  ]
};
