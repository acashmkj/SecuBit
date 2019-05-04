navigator = typeof navigator === 'undefined' ? {} : navigator;
window = typeof window === 'undefined' ? {} : window;
const test = require('tape');
const Shuffle = require('../dist/shufflelink/client/shuffle');

const bcoin = require('bcoin');
const BitcoinBcoin = require('../dist/shufflelink/client/bitcoin_bcoin')
  .default;
let bitcoinUtils = new BitcoinBcoin({ CHAIN: 'tBTC', bcoin });

test('1 Test keys', async t => {
  t.plan(3);
  const key = Shuffle.generateKey();
  const key2 = Shuffle.generateKey();
  t.true(Shuffle.validateKeys(key.getPublicKey(), key.getPrivateKey()));
  t.false(Shuffle.validateKeys(key.getPublicKey(), key2.getPrivateKey()));
  t.false(Shuffle.validateKeys(key2.getPublicKey(), key.getPrivateKey()));
  t.end();
});

test('2 Test encrypt length', async t => {
  const ROUNDS = 10;
  t.plan(ROUNDS);
  for (let i = 0; i < ROUNDS; i++) {
    const key = Shuffle.generateKey();
    const encrypted = Shuffle.encrypt(
      key.getPublicKey(),
      Shuffle.a2hex('test')
    );
    t.equal(encrypted.length, 296);
  }
  t.end();
});

test('3 Test encrypt address length', async t => {
  const ROUNDS = 10;
  t.plan(ROUNDS * 2);
  for (let i = 0; i < ROUNDS; i++) {
    const { fromAddress } = bitcoinUtils.generateAddresses({
      aliceSeed: bitcoinUtils.newMnemonic(),
      secubitSeed: bitcoinUtils.newMnemonic(),
    });
    const rawAddr = bcoin.primitives.Address.fromBase58(fromAddress).toRaw();
    t.equal(rawAddr.length, 25);
    t.equal(rawAddr.toString('hex').length, 50);
  }
  t.end();
});

test('4 Test address encrypt', async t => {
  const ROUNDS = 10;
  t.plan(ROUNDS);
  for (let i = 0; i < ROUNDS; i++) {
    const seed = bitcoinUtils.newMnemonic();
    const { fromAddress } = bitcoinUtils.generateAddresses({
      aliceSeed: seed,
      secubitSeed: seed,
    });

    const key = Shuffle.generateKey();
    const encrypted = Shuffle.encrypt(
      key.getPublicKey(),
      bitcoinUtils.addressToHex(fromAddress)
    );
    t.equal(encrypted.length, 338);
  }
  t.end();
});
