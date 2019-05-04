const test = require('tape');
const Coordinator = require('../server/coordinator');
const Client = require('../dist/blindlink/client/client').default;
const bcoin = require('bcoin');

const { USE_BITCORE } = require('./config');

const BitcoinBitcore = require('../dist/blindlink/client/bitcoin_bitcore');
const BitcoinBcoin = require('../dist/blindlink/client/bitcoin_bcoin').default;
let bitcoinUtils;
if (USE_BITCORE) {
  bitcoinUtils = new BitcoinBitcore('testnet');
} else {
  bitcoinUtils = new BitcoinBcoin({ CHAIN: 'testnet', bcoin });
}

const SERVER_STATES = require('../client/server_states');
const CLIENT_STATES = require('../client/client_states');
const clientNum = Object.keys(CLIENT_STATES).length;

const seed1 =
  'price shy bulb dutch fiber coral chunk burden noodle uniform endorse pyramid';

const seed2 =
  'math wife smart prefer climb place parade holiday demand trophy best sword';

const seed3 =
  'cruel cram picture duck pig endless kitten ignore quantum mesh lobster enroll';

const utxo1 = [
  {
    // Bitcore
    address: 'mzHAYhfXarP1gFkZkUDdGgYUFRmnts4m8b',
    txid: 'cb6c6592e7477d4d493bc502c7fd5f150dce09c9caba6c727661bb131c5247f7',
    vout: 1,
    scriptPubKey: '76a914cdcecb59e531031cc6490300e5cbe3871518db6b88ac',
    amount: 1.268932,

    // Bcoin
    index: 1,
    value: 126893200,
    coinbase: false,
    version: 1,
    hash: 'cb6c6592e7477d4d493bc502c7fd5f150dce09c9caba6c727661bb131c5247f7',
    script: '76a914cdcecb59e531031cc6490300e5cbe3871518db6b88ac',
    height: 1260734,
  },
];
const utxo2 = [
  {
    // Bitcore
    address: 'mrhMGkaxELdoYRSKC2f2MVfs6qpUxHYYcR',
    txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
    vout: 0,
    scriptPubKey: '76a9147aa0b953f896b171ee19cf15f06d82a3cdb353bf88ac',
    amount: 1.27398024,

    // Bcoin
    index: 0,
    value: 127398024,
    coinbase: false,
    version: 1,
    hash: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
    script: '76a9147aa0b953f896b171ee19cf15f06d82a3cdb353bf88ac',
    height: 1260913,
  },
];
// Flip of seed2
// const utxo2 = [ { address: 'mihVM29GkChbh6VT5JdbN2rGYroVjJGsjL',
//     txid: '2c01b06f285d0b1c3481c239ffb2189de78e38f5810bcb1b0be157d748506399',
//     vout: 3,
//     scriptPubKey: '76a91422e67508806d717ab52f0e664284746eb4e397e188ac',
//     amount: 1.273982 } ];

test('1 User Runs Twice', async t => {
  t.plan(38);

  let previousState = null;
  let rounds = 0;
  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    MIN_POOL: 1,
    bitcoinUtils,
  });
  const client = new Client({
    MAX_DELAY: 0,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
    MIN_POOL: 1,
    callbackStateChange: state => {
      t.equal(state, ++previousState % clientNum);
    },
    callbackError: err => {
      t.fail(err.message);
    },
    callbackRoundComplete: tx => {
      if (rounds === 0) {
        t.equal(
          tx.txid,
          'eff5049c2e16153492ec99cb6a6e9cd7907050277b73b7ac0d8f4f52778f7206'
        );
        t.equal(tx.secubits, 1);
        t.equal(
          tx.serialized,
          '0100000001f747521c13bb6176726cbacac909ce0d155ffdc702c53b494d7d47e792656ccb010000006a473044022020d1e7a28a648cb53bb179aa3d56afff1675c09578fac90749b414f28ea861e10220079c55f4e8f91e08fa8346cf3d815d7df811f9b10ab1ec412c14e34268cf5ab60121028f5a98f190385945bcb6f89ce87dab83c8b85a853024ccf4b5d2a205c51140b0ffffffff02a0860100000000001976a914c1c988b5fdac2541305bad20625d75cb549e22a188ac08b28e07000000001976a914be2529eb93e8f629c6aacc39e1c17d3dfc1faf9188ac00000000'
        );
      } else {
        t.equal(
          tx.txid,
          '9ea339a7c12835aba3ca56f2f26ff3ea247fc4a00d7c72e9a95b4f1ea5b8170e'
        );
        t.equal(
          tx.txid,
          '9ea339a7c12835aba3ca56f2f26ff3ea247fc4a00d7c72e9a95b4f1ea5b8170e'
        );
        t.equal(tx.secubits, 1);
        t.equal(
          tx.serialized,
          '010000000140dec4aeff0e5de26edd0a489d35805fd7c4872638740fad25e81a10bf099ec8010000006a47304402203b054d2f202029aff1b2d6a1b2e6be01739926653becde46ffbc47f1f8cf62a302202770659dd199b0e485fb9873d7cdd9bc7958397ab532b6f4e8dc886e6b65d42d012102788c2f26a05543cc7d79eee79eb2e7a21db430a6a19b39f92a80aac8edffba6effffffff02a0860100000000001976a9147d6d95ab1d358225277c2da3d71d1037af55ef8888ac788c6207000000001976a914b24fbe725caca1517cf830aeb006911d922d542c88ac00000000'
        );
      }
      rounds++;
    },
  });

  t.equal(client.serverConnect, false);
  client.connect();
  t.equal(client.serverConnect, true);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  t.equal(client.roundState, CLIENT_STATES.unjoined);
  await client.join();
  t.equal(client.roundState, CLIENT_STATES.joined);
  t.equal(coordinator.roundState, SERVER_STATES.join);
  coordinator.forceStart();
  await client.blind();
  t.equal(coordinator.roundState, SERVER_STATES.outputs);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.signing);
  await client.refreshState();
  do {
    await coordinator.wait(10);
  } while (coordinator.roundState !== SERVER_STATES.join);
  t.equal(coordinator.roundState, SERVER_STATES.join);
  await client.refreshState();

  await client.refreshState();
  const utxo12 = bitcoinUtils.getFakeUtxos({
    address: 'mxrMCger4XD1sAtdwvRLHz54EEdEjqmhPV',
    txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
    vout: 1,
    satoshis: 124000000,
  });
  client.FAKE_UTXOS = utxo12;
  await client.join();
  t.equal(client.roundState, CLIENT_STATES.joined);
  t.equal(coordinator.roundState, SERVER_STATES.join);
  coordinator.forceStart();
  await client.blind();
  t.equal(coordinator.roundState, SERVER_STATES.outputs);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.signing);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.signing);
  do {
    await coordinator.wait(10);
  } while (coordinator.roundState !== SERVER_STATES.join);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  await client.refreshState();

  client.disconnect();
  coordinator.exit();
  t.end();
});

test('2 Users Run', async t => {
  t.plan(36);
  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    MIN_POOL: 2,
  });
  let previousState1 = 0;
  const client1 = new Client({
    MAX_DELAY: 0,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
    callbackStateChange: state => {
      t.equal(state, ++previousState1 % clientNum);
    },
    callbackError: err => {
      t.fail(err.message);
    },
    callbackRoundComplete: tx => {
      t.equal(
        tx.txid,
        'c6387f1064e1616abed764e4b5222caec4f7b83f1a954abf55c95279819563fe'
      );
      t.equal(tx.secubits, 2);
      t.equal(
        tx.serialized,
        '010000000240dec4aeff0e5de26edd0a489d35805fd7c4872638740fad25e81a10bf099ec8000000006b483045022100e847fa167ad6af19bcbf088da4888042aa539ee21ff0986fe89724879120887c02200ec6efe4e43d2a4e7ec4c5db4fd392d3193690566404c1db88d02e0ba7eb571701210277b6da2356b95d5240a412c5467f72e702fb10b46301c0756028315bf85b1f39fffffffff747521c13bb6176726cbacac909ce0d155ffdc702c53b494d7d47e792656ccb010000006a473044022058bbdcd0f90ca282b29e62ea5fce72f3ebeee2c2bae3eebd2a169bed4fdd586802206e264e493925387d59e5b7deb1abd0c366ac4fd1ed025223d8e8297a481b293c0121028f5a98f190385945bcb6f89ce87dab83c8b85a853024ccf4b5d2a205c51140b0ffffffff04a0860100000000001976a914c1c988b5fdac2541305bad20625d75cb549e22a188aca0860100000000001976a914f9d968d73139c2cb84e20170aa60ea8f0db1c40588ac08b28e07000000001976a914be2529eb93e8f629c6aacc39e1c17d3dfc1faf9188ac00669607000000001976a914a4be4ccb554ccc3993b65ca0daf170528e05960088ac00000000'
      );
    },
  });
  let previousState2 = 0;
  const client2 = new Client({
    MAX_DELAY: 0,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed2,
    secubitSeed: seed2,
    FAKE_UTXOS: utxo2,
    callbackStateChange: state => {
      t.equal(state, ++previousState2 % clientNum);
    },
    callbackError: err => {
      t.fail(err.message);
    },
    callbackRoundComplete: tx => {
      t.equal(
        tx.txid,
        'c6387f1064e1616abed764e4b5222caec4f7b83f1a954abf55c95279819563fe'
      );
      t.equal(
        tx.txid,
        'c6387f1064e1616abed764e4b5222caec4f7b83f1a954abf55c95279819563fe'
      );
      t.equal(tx.secubits, 2);
      t.equal(
        tx.serialized,
        '010000000240dec4aeff0e5de26edd0a489d35805fd7c4872638740fad25e81a10bf099ec8000000006b483045022100e847fa167ad6af19bcbf088da4888042aa539ee21ff0986fe89724879120887c02200ec6efe4e43d2a4e7ec4c5db4fd392d3193690566404c1db88d02e0ba7eb571701210277b6da2356b95d5240a412c5467f72e702fb10b46301c0756028315bf85b1f39fffffffff747521c13bb6176726cbacac909ce0d155ffdc702c53b494d7d47e792656ccb010000006a473044022058bbdcd0f90ca282b29e62ea5fce72f3ebeee2c2bae3eebd2a169bed4fdd586802206e264e493925387d59e5b7deb1abd0c366ac4fd1ed025223d8e8297a481b293c0121028f5a98f190385945bcb6f89ce87dab83c8b85a853024ccf4b5d2a205c51140b0ffffffff04a0860100000000001976a914c1c988b5fdac2541305bad20625d75cb549e22a188aca0860100000000001976a914f9d968d73139c2cb84e20170aa60ea8f0db1c40588ac08b28e07000000001976a914be2529eb93e8f629c6aacc39e1c17d3dfc1faf9188ac00669607000000001976a914a4be4ccb554ccc3993b65ca0daf170528e05960088ac00000000'
      );
    },
  });

  client1.connect();
  client2.connect();
  await client1.refreshState();
  await client2.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  await client1.join();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  await client2.join();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  coordinator.forceStart();
  await client1.blind();
  t.equal(coordinator.roundState, SERVER_STATES.blinding);
  await client2.blind();
  t.equal(coordinator.roundState, SERVER_STATES.outputs);
  await client1.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.outputs);
  await client2.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.signing);
  await client1.refreshState();
  t.equal(client1.roundState, CLIENT_STATES.senttx);
  t.equal(coordinator.roundState, SERVER_STATES.signing);
  await client2.refreshState();
  t.equal(client2.roundState, CLIENT_STATES.senttx);
  do {
    await coordinator.wait(10);
  } while (coordinator.roundState !== SERVER_STATES.join);
  t.equal(coordinator.roundState, SERVER_STATES.join);
  await client1.refreshState();
  t.equal(client1.roundState, CLIENT_STATES.unjoined);
  await client2.refreshState();
  t.equal(client2.roundState, CLIENT_STATES.unjoined);

  client1.disconnect();
  client2.disconnect();
  coordinator.exit();
  t.end();
});

const NUM_OF_RUNS = 10;

test(`3 Run ${NUM_OF_RUNS} Users`, async t => {
  t.plan(NUM_OF_RUNS * 13 + 5);

  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
  });

  const clients = [];
  for (let i = 0; i < NUM_OF_RUNS; i++) {
    let previousState = 0;
    const seed = bitcoinUtils.newMnemonic();
    const client = new Client({
      MAX_DELAY: 0,
      DISABLE_UTXO_FETCH: true,
      bitcoinUtils,
      mockFetch: (url, params) => coordinator.mockFetch(url, params),
      aliceSeed: seed,
      secubitSeed: seed,
      callbackStateChange: state => {
        t.equal(state, ++previousState % clientNum);
      },
      callbackError: err => {
        t.fail(err.message);
      },
      callbackRoundComplete: tx => {
        t.equal(tx.secubits, NUM_OF_RUNS);
      },
    });
    const utxos = bitcoinUtils.getFakeUtxos({
      address: client.keys.fromAddress,
      txid: utxo1[0].txid,
      vout: i,
      satoshis: 124000000,
    });
    client.FAKE_UTXOS = utxos;
    clients.push(client);
  }

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    client.connect();
    await client.refreshState();
    t.equal(client.roundState, CLIENT_STATES.unjoined);
    await client.join();
    await client.refreshState();
    t.equal(client.roundState, CLIENT_STATES.joined);
    t.equal(client.getRoundInfo().serverStatus.alices, i + 1);
  }
  t.equal(coordinator.roundState, SERVER_STATES.join);
  t.equal(coordinator.getAlices().length, NUM_OF_RUNS);
  coordinator.forceStart();

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    await client.blind();
    await client.refreshState();
    t.equal(client.getRoundInfo().serverStatus.alices, NUM_OF_RUNS);
  }
  t.equal(coordinator.roundState, SERVER_STATES.outputs);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    await client.refreshState();
  }
  t.equal(coordinator.roundState, SERVER_STATES.signing);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    await client.refreshState();
  }
  do {
    await coordinator.wait(10);
  } while (coordinator.roundState !== SERVER_STATES.join);
  t.equal(coordinator.roundState, SERVER_STATES.join);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    await client.refreshState();
    client.disconnect();
  }

  coordinator.exit();
  t.end();
});

test('4 User Joins and Unjoins', async t => {
  // t.plan(8);

  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    MIN_POOL: 2,
    bitcoinUtils,
  });
  const client = new Client({
    MAX_DELAY: 0,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
  });
  const client2 = new Client({
    MAX_DELAY: 0,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed2,
    secubitSeed: seed2,
    FAKE_UTXOS: utxo2,
  });

  client.connect();
  t.equal(client.serverConnect, true);
  await client.refreshState();
  t.equal(coordinator.state().alices, 0);
  await client.join();
  t.equal(coordinator.state().alices, 1);
  await client.unjoin();
  t.equal(coordinator.state().alices, 0);
  await client.join();
  t.equal(coordinator.state().alices, 1);
  client2.connect();
  await client2.refreshState();
  await client2.join();
  t.equal(coordinator.state().alices, 2);
  await client.disconnect();
  t.equal(coordinator.state().alices, 1);
  await client2.disconnect();
  t.equal(coordinator.state().alices, 0);

  coordinator.exit();
  t.end();
});

test('5 User Autojoins', async t => {
  const ROUNDS = 5;
  t.plan(ROUNDS * 16 + 7);

  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    MIN_POOL: 1,
    bitcoinUtils,
  });
  const client = new Client({
    MAX_DELAY: 0,
    MIN_POOL: 1,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
  });
  let utxos;
  utxos = bitcoinUtils.getFakeUtxos({
    address: client.keys.fromAddress,
    txid: utxo1[0].txid,
    vout: 0,
    satoshis: 124000000,
  });
  client.FAKE_UTXOS = utxos;

  await client.connect();
  await client.setAutoJoin(ROUNDS);
  t.equal(client.autoJoinRounds, ROUNDS);

  for (let i = 0; i < ROUNDS; i++) {
    t.equal(client.autoJoinRounds, ROUNDS - i);
    t.equal(coordinator.roundState, SERVER_STATES.join);
    t.equal(client.roundState, CLIENT_STATES.unjoined);
    await client.refreshState();
    t.equal(coordinator.roundState, SERVER_STATES.join);
    t.equal(client.roundState, CLIENT_STATES.joined);
    coordinator.forceStart();
    await client.blind();
    t.equal(coordinator.roundState, SERVER_STATES.outputs);
    t.equal(client.roundState, CLIENT_STATES.blind);
    await client.refreshState();
    t.equal(coordinator.roundState, SERVER_STATES.signing);
    t.equal(client.roundState, CLIENT_STATES.output);
    await client.refreshState();
    t.equal(coordinator.roundState, SERVER_STATES.signing);
    t.equal(client.roundState, CLIENT_STATES.senttx);
    do {
      await coordinator.wait(10);
    } while (coordinator.roundState !== SERVER_STATES.join);
    t.equal(coordinator.roundState, SERVER_STATES.join);
    t.equal(client.roundState, CLIENT_STATES.senttx);

    await client.refreshState();
    t.equal(coordinator.roundState, SERVER_STATES.join);
    t.equal(client.roundState, CLIENT_STATES.unjoined);
    t.equal(client.autoJoinRounds, ROUNDS - i - 1);
    utxos = bitcoinUtils.getFakeUtxos({
      address: client.keys.fromAddress,
      txid: utxo1[0].txid,
      vout: 0,
      satoshis: 124000000,
    });
    client.FAKE_UTXOS = utxos;
  }
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  t.equal(client.roundState, CLIENT_STATES.unjoined);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  t.equal(client.roundState, CLIENT_STATES.unjoined);
  await client.refreshState();
  t.equal(coordinator.roundState, SERVER_STATES.join);
  t.equal(client.roundState, CLIENT_STATES.unjoined);

  await client.disconnect();
  coordinator.exit();
  t.end();
});

test('6 Failed autojoin', async t => {
  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    MIN_POOL: 1,
    OUTPUT_SAT: 100,
    bitcoinUtils,
  });
  const client = new Client({
    MAX_DELAY: 0,
    MIN_POOL: 1,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
  });
  const utxos = bitcoinUtils.getFakeUtxos({
    address: client.keys.fromAddress,
    txid: utxo1[0].txid,
    vout: 0,
    satoshis: 1,
  });
  client.FAKE_UTXOS = utxos;

  await client.connect();
  await client.setAutoJoin(3);
  t.equal(client.autoJoinRounds, 3);
  t.false(client.roundError);
  await client.refreshState();
  t.true(client.roundError);
  t.equal(client.autoJoinRounds, 0);

  await client.disconnect();
  coordinator.exit();
  t.end();
});

test('7 Test Max Fees', async t => {
  t.plan(4);

  const coordinator1 = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    FEE_PER_USER: 1000,
    bitcoinUtils,
  });
  const client1 = new Client({
    MAX_FEE: 1000,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator1.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
  });
  await client1.connect();
  await client1.refreshState();
  await client1.joinRound();
  t.equal(client1.roundState, CLIENT_STATES.joined);

  const coordinator2 = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    FEE_PER_INPUT: 1001,
    bitcoinUtils,
  });
  const client2 = new Client({
    MAX_FEE: 1000,
    DISABLE_UTXO_FETCH: true,
    bitcoinUtils,
    mockFetch: (url, params) => coordinator2.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
  });
  await client2.connect();
  await client2.refreshState();
  t.equal(client2.roundState, CLIENT_STATES.unjoined);
  try {
    await client2.joinRound();
  } catch (err) {
    t.equal(err.message, 'Fees are greater than your max fee: 1000');
  }
  t.equal(client2.roundState, CLIENT_STATES.unjoined);

  await client1.disconnect();
  coordinator1.exit();
  await client2.disconnect();
  coordinator2.exit();
  t.end();
});

test('8 Test Blame Game', async t => {
  t.plan(4);

  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    OUTPUTS_TIMEOUT: 50, // Speed up timeout
    BLAME_TIMEOUT: 10,
    bitcoinUtils,
  });
  const client1 = new Client({
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
    MAX_DELAY: 0,
  });
  const client2 = new Client({
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed2,
    secubitSeed: seed2,
    FAKE_UTXOS: utxo2,
    MAX_DELAY: 0,
  });
  await client1.connect();
  await client2.connect();
  await client1.refreshState();
  await client2.refreshState();
  await client1.join();
  await client2.join();
  coordinator.forceStart();
  await client1.blind();
  await client2.blind();
  await client2.disconnect();
  await client1.refreshState();
  t.equal(SERVER_STATES.outputs, coordinator.roundState);
  while (coordinator.roundState === SERVER_STATES.outputs) {
    // Wait until timeout
    await coordinator.wait(1);
  }
  t.equal(coordinator.roundState, SERVER_STATES.blamegame);
  await client1.refreshState();
  while (coordinator.roundState === SERVER_STATES.blamegame) {
    await coordinator.wait(10);
  }
  await client1.refreshState();
  t.equal(Object.keys(coordinator.punishedAddresses).length, 1);
  t.equal(
    coordinator.punishedAddresses['mrhMGkaxELdoYRSKC2f2MVfs6qpUxHYYcR'],
    1
  );

  await client1.disconnect();

  coordinator.exit();
  t.end();
});

test('9 Test min_pool', async t => {
  t.plan(2);

  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    OUTPUTS_TIMEOUT: 50, // Speed up timeout
    BLAME_TIMEOUT: 10,
    bitcoinUtils,
    MIN_POOL: 1,
  });
  const client1 = new Client({
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
    MAX_DELAY: 0,
    MIN_POOL: 1,
  });
  await client1.connect();
  await client1.refreshState();
  await client1.join();
  coordinator.forceStart();
  client1.MIN_POOL = 2; // Change min_pool
  t.equal(coordinator.state().alices, 1);
  await client1.blind();
  await client1.refreshState();
  try {
    await client1.getTx();
  } catch (err) {
    t.equal(err.message, 'Not enough alices in the round');
  }

  await client1.disconnect();
  coordinator.exit();
  t.end();
});

test('10 Test min_pool server removal', async t => {
  t.plan(2);

  const coordinator = new Coordinator({
    DISABLE_BROADCAST: true,
    DISABLE_UTXO_FETCH: true,
    // OUTPUTS_TIMEOUT: 50,
    // BLAME_TIMEOUT: 10,
    bitcoinUtils,
    MIN_POOL: 2,
  });
  const client1 = new Client({
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed1,
    secubitSeed: seed1,
    FAKE_UTXOS: utxo1,
    MAX_DELAY: 0,
    MIN_POOL: 1,
  });
  await client1.connect();
  await client1.refreshState();
  await client1.join();
  const client2 = new Client({
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed2,
    secubitSeed: seed2,
    FAKE_UTXOS: utxo2,
    MAX_DELAY: 0,
    MIN_POOL: 2,
  });
  await client2.connect();
  await client2.refreshState();
  await client2.join();
  const utxo3 = bitcoinUtils.getFakeUtxos({
    address: 'mhtdy5akwJNoRAyZKbgkkLnKauTyVJBPoU',
    txid: 'c89e09bf101ae825ad0f74382687c4d75f80359d480add6ee25d0effaec4de40',
    vout: 1,
    satoshis: 124000000,
  });
  const client3 = new Client({
    bitcoinUtils,
    mockFetch: (url, params) => coordinator.mockFetch(url, params),
    aliceSeed: seed3,
    secubitSeed: seed3,
    FAKE_UTXOS: utxo3,
    MAX_DELAY: 0,
    MIN_POOL: 4,
  });
  await client3.connect();
  await client3.refreshState();
  await client3.join();
  t.equal(coordinator.state().alices, 3);
  coordinator.forceStart();
  t.equal(coordinator.state().alices, 2);

  await client1.disconnect();
  await client2.disconnect();
  await client3.disconnect();
  coordinator.exit();
  t.end();
});
