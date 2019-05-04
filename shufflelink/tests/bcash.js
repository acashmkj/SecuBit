const test = require('tape');

const bcoin = require('bcash');
const BitcoinBcoin = require('../dist/shufflelink/client/bitcoin_bcoin')
  .default;
let bitcoinUtils = new BitcoinBcoin({ CHAIN: 'tBCH', bcoin });

const seed1 =
  'price shy bulb dutch fiber coral chunk burden noodle uniform endorse pyramid';
const seed2 =
  'paper act oyster secret spice urge uncover odor fun segment immense exhaust';
const xpub1 =
  'tpubDCZhmmveHwnNhYD6KdDavDmfcGgQMMWegwhNqpeb1D9CQUsGmtij5oMiHRRGWdfb4zryswnfm55YMGz7n6JjGmddr8uZp7yvbAWNhXF77iE';
// const xpriv1 =
//   'tprv8fsfdMtQ9a6hp5BJRyYzWp7Z3FAUC2Kk7e6bZJcHawLoZzcW9Vu8uJjr7G9iSE8KS21aX2GjeDZZReKp32kqHJ1iCreKQAaExbHgSy7DiLQ';
const address1 = 'bchtest:qzy2sz0ktecf4ksaqlmef79ljytjar9twyrj4sed47';

test('Test Mnemonic', async t => {
  // t.plan(5);
  let seed;
  seed = bitcoinUtils.newMnemonic(seed1);
  t.equal(seed, seed1);
  seed = bitcoinUtils.newMnemonic();
  t.equal(typeof seed, 'string');
  t.equal(seed.split(' ').length, 12);
  t.equal(bitcoinUtils.isMnemonicValid(seed1), true);
  t.equal(bitcoinUtils.isMnemonicValid('not valid seed woiefjw2'), false);
  t.equal(bitcoinUtils.isMnemonicValid(''), false);
  t.end();
});

test('Test Address Generation', async t => {
  // t.plan(5);
  let addresses;
  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
  });
  // console.log(JSON.stringify(addresses));
  t.equal(
    addresses.fromAddress,
    'bchtest:qpnye83ud57dumd2dsee20s9fx9ygrxf5gyg9trqev'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qr4k9afcdhgjcx809p4pj0jg2kdq6mfshu49agtww8'
  );
  t.equal(
    addresses.toAddress,
    'bchtest:qzlstrq9yza7xkazvamzs59t77rlwrc9f5c5htpn84'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    aliceIndex: 1,
    secubitIndex: 2,
  });
  t.equal(
    addresses.fromAddress,
    'bchtest:qr4k9afcdhgjcx809p4pj0jg2kdq6mfshu49agtww8'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qrs8q3awx0kz5l80slt39pdaflrf3pathv0xyx3j49'
  );
  t.equal(
    addresses.toAddress,
    'bchtest:qpjd4y4973n80c9am77se4eg0kelcx69658g3kqtcg'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed2,
    aliceIndex: 4,
  });
  t.equal(
    addresses.fromAddress,
    'bchtest:qqpa3p8stddc9ffcx0lwfgmdymzeqx8qjqah7s86j3'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qp4m2s5w6lrj2g3faqmg3l6e7p3g4a0m9y0rugrdzy'
  );
  t.equal(
    addresses.toAddress,
    'bchtest:qzxvdre3qdtc8a0j3v3shepjrrtmx8g6eg2lxhfe2v'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed2,
    aliceIndex: 0,
    secubitIndex: 2,
  });
  t.equal(
    addresses.fromAddress,
    'bchtest:qpnye83ud57dumd2dsee20s9fx9ygrxf5gyg9trqev'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qr4k9afcdhgjcx809p4pj0jg2kdq6mfshu49agtww8'
  );
  t.equal(
    addresses.toAddress,
    'bchtest:qzyuczp374qz3e6gtyjjcml27sedykwn9uwnmn5wmz'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: xpub1,
    aliceIndex: 0,
    secubitIndex: 0,
  });
  t.equal(
    addresses.fromAddress,
    'bchtest:qpnye83ud57dumd2dsee20s9fx9ygrxf5gyg9trqev'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qr4k9afcdhgjcx809p4pj0jg2kdq6mfshu49agtww8'
  );
  t.equal(
    addresses.toAddress,
    'bchtest:qrxuaj6eu5csx8xxfypspewtuwr32xxmdv6t5c9ayp'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: xpub1,
    secubitIndex: 3,
  });
  t.equal(
    addresses.toAddress,
    'bchtest:qzxjrct9zamxyyr3w972ezpccvr3v47z9gx45ejpt6'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    changeIndex: 6,
  });
  t.equal(
    addresses.fromAddress,
    'bchtest:qpnye83ud57dumd2dsee20s9fx9ygrxf5gyg9trqev'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qr3d7sdlscwequ6wf3lvwlpqkvmn9527su7jthj90q'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    aliceIndex: 1,
    changeIndex: 1,
  });
  t.equal(
    addresses.fromAddress,
    'bchtest:qr4k9afcdhgjcx809p4pj0jg2kdq6mfshu49agtww8'
  );
  t.equal(
    addresses.changeAddress,
    'bchtest:qr4k9afcdhgjcx809p4pj0jg2kdq6mfshu49agtww8'
  );

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: address1,
  });
  t.equal(
    addresses.toAddress,
    'bchtest:qzy2sz0ktecf4ksaqlmef79ljytjar9twyrj4sed47'
  );

  t.end();
});

test('Test Address Signing', async t => {
  // t.plan(5);
  const addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
  });
  const msg = addresses.fromAddress;
  const signature = bitcoinUtils.signMessage(msg, addresses.fromPrivate);
  t.equal(
    bitcoinUtils.verifyMessage(msg, addresses.fromAddress, signature),
    true
  );
  t.equal(
    bitcoinUtils.verifyMessage(
      'invalid message',
      addresses.fromAddress,
      signature
    ),
    false
  );
  t.end();
});

test('Test Address validation', async t => {
  // t.plan(5);
  t.false(
    bitcoinUtils.isInvalid('bchtest:qrxuaj6eu5csx8xxfypspewtuwr32xxmdv6t5c9ayp')
  );
  t.true(bitcoinUtils.isInvalid('invalidAddress'));
  t.true(
    bitcoinUtils.isInvalid('bchtest:qrxuaj6eu5csx8xxfypspewtuwr32xxmdv6t5c9ayG')
  );

  t.end();
});

// test('Test Create Transaction', async t => {
//   // t.plan(5);
//   // bitcoinUtils.createTransaction({
//   //
//   // })
//
//   t.end();
// });

test('Test validateUtxo', async t => {
  t.plan(2);
  const utxo = bitcoinUtils.getFakeUtxos({
    address: 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8',
    txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
    vout: 1,
    satoshis: 124000000,
  });
  t.equal(bitcoinUtils.validateUtxo(utxo), true);
  utxo[0].coinbase = true;
  t.throws(
    () => bitcoinUtils.validateUtxo(utxo),
    'Invalid utxo. No Coinbase coins allowed.'
  );
  t.end();
});

test('Test compareUtxoSets', async t => {
  t.plan(15);
  let utxos1 = [
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qrxuaj6eu5csx8xxfypspewtuwr32xxmdv6t5c9ayp',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qrqunz94lkkz2sfstwkjqcjawh94f83z5y9vft30xa',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de42',
      vout: 1,
      satoshis: 124000000,
    }),
  ];
  let utxos2 = utxos1.slice(); // Copy
  t.equal(bitcoinUtils.compareUtxoSets(utxos1, utxos2), true);

  // Utxo has different txid
  utxos2.splice(
    0,
    1,
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de43',
      vout: 1,
      satoshis: 124000000,
    })
  );
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8');
  }

  // Missing utxo
  utxos2.splice(0, 1);
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8');
  }
  try {
    bitcoinUtils.compareUtxoSets(utxos1, []);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 3);
    t.equal(err.data[0], 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8');
    t.equal(err.data[1], 'bchtest:qrxuaj6eu5csx8xxfypspewtuwr32xxmdv6t5c9ayp');
    t.equal(err.data[2], 'bchtest:qrqunz94lkkz2sfstwkjqcjawh94f83z5y9vft30xa');
  }

  // Utxo has different txid
  utxos1 = [
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qrxuaj6eu5csx8xxfypspewtuwr32xxmdv6t5c9ayp',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
  ];
  utxos2 = utxos1.slice(); // Copy
  utxos2.splice(
    0,
    1,
    ...bitcoinUtils.getFakeUtxos({
      address: 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
      vout: 1,
      satoshis: 124000000,
    })
  );
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8');
  }

  t.end();
});

test('Test address to hex', async t => {
  t.plan(1);
  const addr = 'bchtest:qzlz220tj050v2wx4txrncwp057lc8a0jy7er4yec8';
  const hex = bitcoinUtils.addressToHex(addr);
  const address = bitcoinUtils.hexToAddress(hex);
  t.equal(addr, address);
  t.end();
});

test('Test cashaddr normalize', async t => {
  t.plan(1);
  const addr = 'bchtest:qpr7gquf5kqv8j4a60dqrg7n0z25yy5a2czq4hkald';
  const address = bitcoinUtils.normalizeAddress(addr);
  t.equal(address, 'mn55RMMwpgKedHD8VuoQtY5nTcGvcXtvyH');
  t.end();
});

test('Test Transaction size', async t => {
  t.plan(12);

  // base tx 10 bytes
  // every output is 34 bytes
  // every input is 41 bytes
  const baseSize = 10;
  const outputSize = 34;
  const inputSize = 41;
  const sigSize = 106; // 1 byte less than BTC

  const addresses1 = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    aliceIndex: 0,
    secubitIndex: 0,
  });
  const addresses2 = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    aliceIndex: 2,
    secubitIndex: 1,
  });

  let tx = bitcoinUtils.createTransaction({
    alices: [],
    secubits: [],
    utxos: [],
    fees: 1,
    denomination: 10000,
    min_pool: 0,
  });
  t.equal(tx.size, 10);
  t.equal(tx.size, baseSize); // 10 bytes

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    secubits: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: addresses1.fromAddress,
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    fees: 1,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 119);
  t.equal(tx.size, baseSize + 1 * inputSize + 2 * outputSize);

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
      {
        fromAddress: addresses2.fromAddress,
        changeAddress: addresses2.changeAddress,
      },
    ],
    secubits: [
      {
        toAddress: addresses1.toAddress,
      },
      {
        toAddress: addresses2.toAddress,
      },
    ],
    utxos: [
      ...bitcoinUtils.getFakeUtxos({
        address: addresses1.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
        vout: 1,
        satoshis: 124000000,
      }),
      ...bitcoinUtils.getFakeUtxos({
        address: addresses2.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
        vout: 1,
        satoshis: 124000000,
      }),
    ],
    fees: 1,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 228);
  t.equal(tx.size, baseSize + 2 * inputSize + outputSize * 4);

  const expectedFee = bitcoinUtils.calculateFeeSat({
    users: 1,
    inputs: 1,
    outputs: 2,
    fees: 1,
  });
  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    secubits: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: addresses1.fromAddress,
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 10000 + expectedFee,
    }),
    fees: expectedFee,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 85);
  t.equal(tx.size, baseSize + 1 * inputSize + 1 * outputSize);

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    secubits: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: [
      ...bitcoinUtils.getFakeUtxos({
        address: addresses1.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
        vout: 1,
        satoshis: 11000,
      }),
      ...bitcoinUtils.getFakeUtxos({
        address: addresses1.fromAddress,
        txid:
          'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
        vout: 1,
        satoshis: 11000,
      }),
    ],
    fees: 1,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
  });
  t.equal(tx.size, 160);
  t.equal(tx.size, baseSize + 2 * inputSize + 2 * outputSize);

  tx = bitcoinUtils.createTransaction({
    alices: [
      {
        fromAddress: addresses1.fromAddress,
        changeAddress: addresses1.changeAddress,
      },
    ],
    secubits: [
      {
        toAddress: addresses1.toAddress,
      },
    ],
    utxos: bitcoinUtils.getFakeUtxos({
      address: addresses1.fromAddress,
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    fees: 1,
    denomination: 10000,
    fromAddress: addresses1.fromAddress,
    toAddress: addresses1.toAddress,
    min_pool: 1,
    key: addresses1.fromPrivate,
  });
  t.equal(tx.size, 225); // 1 byte less than BTC
  t.equal(tx.size, baseSize + 1 * inputSize + 2 * outputSize + 1 * sigSize);

  t.end();
});
