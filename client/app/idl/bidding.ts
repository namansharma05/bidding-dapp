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
          "name": "price",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
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
  "types": [
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
            "name": "price",
            "type": "u64"
          },
          {
            "name": "itemId",
            "type": "u16"
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
