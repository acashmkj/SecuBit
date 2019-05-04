const test = require('tape');

const { USE_BITCORE } = require('./config');

const bcoin = require('bcoin');

const BitcoinBitcore = require('../dist/blindlink/client/bitcoin_bitcore');
const BitcoinBcoin = require('../dist/blindlink/client/bitcoin_bcoin').default;
let bitcoinUtils;
if (USE_BITCORE) {
  bitcoinUtils = new BitcoinBitcore('testnet');
} else {
  bitcoinUtils = new BitcoinBcoin({ CHAIN: 'testnet', bcoin });
}

const seed1 =
  'price shy bulb dutch fiber coral chunk burden noodle uniform endorse pyramid';
const seed2 =
  'paper act oyster secret spice urge uncover odor fun segment immense exhaust';
const xpub1 =
  'tpubDCZhmmveHwnNhYD6KdDavDmfcGgQMMWegwhNqpeb1D9CQUsGmtij5oMiHRRGWdfb4zryswnfm55YMGz7n6JjGmddr8uZp7yvbAWNhXF77iE';
// const xpriv1 =
//   'tprv8fsfdMtQ9a6hp5BJRyYzWp7Z3FAUC2Kk7e6bZJcHawLoZzcW9Vu8uJjr7G9iSE8KS21aX2GjeDZZReKp32kqHJ1iCreKQAaExbHgSy7DiLQ';
const address1 = 'msyXVh4Sq9tiBcY2ghsmEhAwPaMd5DqBmi';

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
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.toAddress, 'myBc8uZJeyc5wo987cSvUa5n1HbTdpXj7i');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    aliceIndex: 1,
    secubitIndex: 2,
  });
  t.equal(addresses.fromAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.changeAddress, 'mwmn6uU2bPuQRdKox2Q9EXfummcHSAmsEE');
  t.equal(addresses.toAddress, 'mgaXnzFBAKdzuKXAZWGpjwCXZmRnCYBSin');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed2,
    aliceIndex: 4,
  });
  t.equal(addresses.fromAddress, 'msyXVh4Sq9tiBcY2ghsmEhAwPaMd5DqBmi');
  t.equal(addresses.changeAddress, 'mgATQpCWk2uR2tnB9d2s9asWsPWMq5hjY3');
  t.equal(addresses.toAddress, 'mjCSs5NDDzeBwYnwFuWqJDGg927mGW8YX7');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed2,
    aliceIndex: 0,
    secubitIndex: 2,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.toAddress, 'mikC61eegK7fNCQ6vE62PUvh67DAcrfPXK');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: xpub1,
    aliceIndex: 0,
    secubitIndex: 0,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.toAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: xpub1,
    secubitIndex: 3,
  });
  t.equal(addresses.toAddress, 'mtPCAA4GgDfhduFrmg4kkRAam6VCQUx76h');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    changeIndex: 6,
  });
  t.equal(addresses.fromAddress, 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
  t.equal(addresses.changeAddress, 'n4TDSqnvck8BtsGgTzTg5sdzqe8ByzyYt2');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: seed1,
    aliceIndex: 1,
    changeIndex: 1,
  });
  t.equal(addresses.fromAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  t.equal(addresses.changeAddress, 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');

  addresses = bitcoinUtils.generateAddresses({
    aliceSeed: seed1,
    secubitSeed: address1,
  });
  t.equal(addresses.toAddress, 'msyXVh4Sq9tiBcY2ghsmEhAwPaMd5DqBmi');

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
  t.false(bitcoinUtils.isInvalid('mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b'));
  t.true(bitcoinUtils.isInvalid('invalidAddress'));
  t.true(bitcoinUtils.isInvalid('mzHAYhfXarPxxxkZkUDdGgYUFRmnts4m8b'));

  t.end();
});

test('Test Create Transaction', async t => {
  // t.plan(5);
  // bitcoinUtils.createTransaction({
  //
  // })

  t.end();
});

test('Test validateUtxo', async t => {
  t.plan(2);
  const utxo = bitcoinUtils.getFakeUtxos({
    address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
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
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de41',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'myBc8uZJeyc5wo987cSvUa5n1HbTdpXj7i',
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
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
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
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  }

  // Missing utxo
  utxos2.splice(0, 1);
  try {
    bitcoinUtils.compareUtxoSets(utxos1, utxos2);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 1);
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  }
  try {
    bitcoinUtils.compareUtxoSets(utxos1, []);
  } catch (err) {
    t.equal(err.message, 'Utxo change');
    t.equal(err.data.length, 3);
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
    t.equal(err.data[1], 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b');
    t.equal(err.data[2], 'myBc8uZJeyc5wo987cSvUa5n1HbTdpXj7i');
  }

  // Utxo has different txid
  utxos1 = [
    ...bitcoinUtils.getFakeUtxos({
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
      txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
      vout: 1,
      satoshis: 124000000,
    }),
    ...bitcoinUtils.getFakeUtxos({
      address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
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
      address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
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
    t.equal(err.data[0], 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV');
  }

  t.end();
});
