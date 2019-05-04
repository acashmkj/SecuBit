navigator = typeof navigator === 'undefined' ? {} : navigator;
window = typeof window === 'undefined' ? {} : window;
const test = require('tape');
const Network = require('../dist/shufflelink/client/network').default;
const Servers = require('../server/server');
const version = require('../../package.json').version;
const Config = require('../server/configuration');

const CHAINS = ['tBTC', 'tBCH'];

const bcash = require('bcash');
const Bitcoin = require('../dist/shufflelink/client/bitcoin_bcoin').default;
const bitcoinUtilsCash = new Bitcoin({
  CHAIN: 'tBCH',
  bcoin: bcash,
});
const bcoin = require('bcoin');
const bitcoinUtilsCore = new Bitcoin({
  CHAIN: 'tBTC',
  bcoin,
});
const bitcoinUtils = {
  tBTC: bitcoinUtilsCore,
  tBCH: bitcoinUtilsCash,
};

test('1 Test socket.io', async t => {
  const NUM_OF_USERS = 10;
  t.plan(2 * (2 + NUM_OF_USERS));
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
        callbackBalance: response => {
          console.log('callbackBalance', response);
        },
        callbackRoundComplete: response => {
          console.log('callbackRoundComplete', response.error);
          t.false(response.error);
        },
        callbackError: response => {
          console.log('callbackError', response);
          if (response) {
            t.throws(new Error('Should not happen'));
          }
        },
        callbackStateChange: response => {
          console.log('callbackStateChange', response);
        },
      });
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    t.true(success);
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
    t.equal(1, 1);
  }
  await server.exit();
  server = null;
  t.end();
});

test('2 Test timeout', async t => {
  const NUM_OF_USERS = 3;
  t.plan(2 * (2 + NUM_OF_USERS + NUM_OF_USERS));
  const CONFIG = await Config.get(true);
  let server = new Servers({
    bitcoinUtilsCore,
    bitcoinUtilsCash,
    CONFIG: { ...CONFIG, TIMEOUT: 3 },
  });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);

    console.log('Creating clients...');
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
        callbackBalance: response => {
          console.log(i, 'callbackBalance', response);
        },
        callbackRoundComplete: response => {
          // console.log(i, 'callbackRoundComplete', response);
          t.true(response.error);
        },
        callbackError: response => {
          console.log(i, 'callbackError', response);
          // t.throws(new Error(response.error));
          if (response) {
            t.equal(response.error, 'Round failed at state: shuffling');
          }
        },
        callbackStateChange: response => {
          console.log(i, 'callbackStateChange', response);
        },
      });
      if (i === 1) {
        // Force timeout
        client.shuffle = async function() {
          await client.wait(5000);
          return { error: 'Something went wrong' };
        };
      }
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    t.false(success);
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
    t.equal(1, 1);
  }
  await server.exit();
  server = null;
  t.end();
});

test('3 Test min_pool server', async t => {
  const NUM_OF_USERS = 2;
  t.plan(1 * 2);
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        min_pool: NUM_OF_USERS + 1,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
        callbackBalance: response => {
          console.log(i, 'callbackBalance', response);
        },
        callbackRoundComplete: response => {
          console.log(i, 'callbackRoundComplete', response);
        },
        callbackError: response => {
          console.log(i, 'callbackError', response);
        },
        callbackStateChange: response => {
          console.log(i, 'callbackStateChange', response);
        },
      });
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    t.false(success);
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
  }
  await server.exit();
  server = null;
  t.end();
});

test('4 Test min_pool client', async t => {
  const NUM_OF_USERS = 2;
  t.plan(2 * (1 + NUM_OF_USERS));
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
        callbackBalance: response => {
          console.log(i, 'callbackBalance', response);
        },
        callbackRoundComplete: response => {
          console.log(i, 'callbackRoundComplete', response);
          t.equals(response.error, 'Round failed at state: shuffling');
        },
        callbackError: response => {
          console.log(i, 'callbackError', response);
        },
        callbackStateChange: response => {
          console.log(i, 'callbackStateChange', response);
          if (response === 2) {
            client.min_pool = NUM_OF_USERS + 1;
          }
        },
      });
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    t.false(success);
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
  }

  await server.exit();
  server = null;
  t.end();
});

test('5 Test blame game shuffling', async t => {
  const NUM_OF_USERS = 10;
  t.plan(2 * 3);
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    const BAD_USER = 5;
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
      });
      if (i === BAD_USER) {
        // Force blame game
        client.shuffle = async function() {
          return { error: 'Something went wrong' };
        };
      }
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    t.false(success, 'Round failed at state: shuffling');
    t.equal(
      Object.keys(server.punishedUsers).length,
      CHAINS.indexOf(chain) + 1
    );
    t.equal(
      server.punishedUsers[Clients[BAD_USER].roundParams.keys.fromAddress],
      1
    );
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
  }
  await server.exit();
  server = null;
  t.end();
});

test('6 Test blame game shuffle duplicate onions', async t => {
  const NUM_OF_USERS = 10;
  t.plan(2 * 3);
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    const BAD_USER = 5;
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
      });
      if (i === BAD_USER) {
        // Force blame game
        const origShuffle = client.shuffle.bind(client);
        client.shuffle = async function(params) {
          const res = await origShuffle(params);
          res.onions[0] = res.onions[1];
          return res;
        };
      }
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    t.false(success, 'Round failed at state: shuffling');
    t.equal(
      Object.keys(server.punishedUsers).length,
      CHAINS.indexOf(chain) + 1
    );
    t.equal(
      server.punishedUsers[Clients[BAD_USER].roundParams.keys.fromAddress],
      1
    );
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
  }
  await server.exit();
  server = null;
  t.end();
});

test('7 Test blame game shuffle invalid onions', async t => {
  const NUM_OF_USERS = 3;
  t.plan(2 * 3);
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    const BAD_USER = 2;
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
      });
      if (i === BAD_USER) {
        // Force blame game
        const origShuffle = client.shuffle.bind(client);
        client.shuffle = async function(params) {
          const res = await origShuffle(params);
          res.onions[BAD_USER] = res.onions[BAD_USER].split('')
            .reverse()
            .join('');
          return res;
        };
      }
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    console.log(Clients.map(client => client.roundParams.keys.fromAddress));
    t.false(success, 'Round failed at state: shuffling');
    t.equal(
      Object.keys(server.punishedUsers).length,
      CHAINS.indexOf(chain) + 1
    );
    t.equal(
      server.punishedUsers[Clients[BAD_USER].roundParams.keys.fromAddress],
      1
    );
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
  }
  await server.exit();
  server = null;
  t.end();
});

test('8 Test not signing tx', async t => {
  const NUM_OF_USERS = 3;
  t.plan(2 * 3);
  const CONFIG = await Config.get(true);
  let server = new Servers({ bitcoinUtilsCore, bitcoinUtilsCash, CONFIG });

  for (const chain of CHAINS) {
    console.log('Running chain', chain);
    console.log('Creating clients...');
    const BAD_USER = 2;
    let Clients = [];
    for (let i = 0; i < NUM_OF_USERS; i++) {
      const seed = bitcoinUtils[chain].newMnemonic();
      const client = new Network({
        chain,
        version,
        aliceSeed: seed,
        secubitSeed: seed,
        bitcoinUtils: bitcoinUtils[chain],
        serverAddress: `http://localhost:${CONFIG.PORT}`,
      });
      if (i === BAD_USER) {
        // Force blame game
        // const origFunc = client.sign.bind(client);
        client.sign = async function() {
          return { error: 'something' };
        };
      }
      await client.connect();
      Clients.push(client);
    }
    console.log('Created clients.');
    const success = await server.start({ chain });
    console.log(Clients.map(client => client.roundParams.keys.fromAddress));
    t.false(success, 'Round failed at state: shuffling');
    t.equal(
      Object.keys(server.punishedUsers).length,
      CHAINS.indexOf(chain) + 1
    );
    t.equal(
      server.punishedUsers[Clients[BAD_USER].roundParams.keys.fromAddress],
      1
    );
    for (const client of Clients) {
      await client.disconnect();
    }
    Clients = null;
  }
  await server.exit();
  server = null;
  t.end();
});
