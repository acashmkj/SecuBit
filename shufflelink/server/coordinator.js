const SERVER_STATES = require('../client/server_states');
const SERVER_VERSION = require('../../package.json').version;
const Shuffle = require('../client/shuffle');
const randombytes = require('randombytes');
const sha256 = require('js-sha256');
const Logger = require('./logger');
const path = require('path');
const Config = require('./configuration');

class Coordinator {
  constructor({
    bitcoinUtilsCore,
    bitcoinUtilsCash,
    CONFIG,
    DEBUG_TEST_MODE = true,
    PUNISH_BAN_LIMIT = 3,
    ENFORCE_PUNISHMENT = false,
  }) {
    if (CONFIG.LOG_TO_FILE) {
      this.logger = new Logger(path.join(__dirname, '../../logs'));
    } else {
      this.logger = new Logger();
    }
    this.bitcoinUtils = {
      tBTC: bitcoinUtilsCore,
      tBCH: bitcoinUtilsCash,
      BTC: bitcoinUtilsCore,
      BCH: bitcoinUtilsCash,
    };
    this.tstart = {};
    this.DEBUG_TEST_MODE = DEBUG_TEST_MODE;
    this.CONFIG = CONFIG;
    this.PUNISH_BAN_LIMIT = PUNISH_BAN_LIMIT;
    this.connections = {};
    this.punishedUsers = {};
    this.ENFORCE_PUNISHMENT = ENFORCE_PUNISHMENT;
    this.alices = {
      tBTC: {},
      tBCH: {},
      BTC: {},
      BCH: {},
    };
    this.roundParams = {
      tBTC: {},
      tBCH: {},
      BTC: {},
      BCH: {},
    };
    this.PUBLIC_KEY_LENGTH = Shuffle.generateKey().getPublicKey().length;
    if (!DEBUG_TEST_MODE) {
      if (CONFIG.TESTNET) {
        if (bitcoinUtilsCore) {
          this.logger.tBTC.log('Starting using config:', this.CONFIG);
          this.loopStart('tBTC');
        }
        if (bitcoinUtilsCash) {
          this.logger.tBCH.log('Starting using config:', this.CONFIG);
          this.loopStart('tBCH');
        }
      } else {
        if (bitcoinUtilsCore) {
          this.logger.BTC.log('Starting using config:', this.CONFIG);
          this.loopStart('BTC');
        }
        if (bitcoinUtilsCash) {
          this.logger.BCH.log('Starting using config:', this.CONFIG);
          this.loopStart('BCH');
        }
      }
    }
    this.chainRates = {
      BTC: null,
      BCH: null,
      tBTC: null,
      tBCH: null,
    };

    if (CONFIG.FETCH_RATES) {
      const fetch = require('node-fetch');
      const url = `https://api.coinmarketcap.com/v2/ticker/`;
      const fetchRates = async () => {
        try {
          const res = await fetch(url);
          const json = await res.json();
          this.chainRates.tBTC = json.data['1'].quotes.USD.price;
          this.chainRates.BTC = json.data['1'].quotes.USD.price;
          this.chainRates.tBCH = json.data['1831'].quotes.USD.price;
          this.chainRates.BCH = json.data['1831'].quotes.USD.price;
          this.logger.log(
            `Coinmarketcap: BTC: ${this.chainRates.BTC}, BCH: ${
              this.chainRates.BCH
            }`
          );
        } catch (err) {
          this.logger.error('Coinmarketcap error', err);
        }
      };
      fetchRates();
      setInterval(() => fetchRates(), 60 * 1000);
    }
  }
  disconnected(uuid) {
    delete this.connections[uuid];
  }
  connected(params) {
    this.connections[params.uuid] = params;
  }
  exit() {
    Object.keys(this.tstart).map(key => clearTimeout(this.tstart[key]));
  }
  getAlices(chain) {
    return Object.keys(this.alices[chain]).map(key => this.alices[chain][key]);
  }
  getConnections() {
    return Object.keys(this.connections).map(key => this.connections[key]);
  }
  async broadcastError(error, chain) {
    return await this.asyncSend(this.getConnections(), async connection => {
      if (typeof connection.roundError === 'function') {
        await connection.roundError({ error, chain });
      }
    });
  }

  async balance({ address, chain }) {
    const { DENOMINATION, SAT_PER_BYTE } = this.CONFIG;
    if (this.DEBUG_TEST_MODE) {
      const utxos = this.bitcoinUtils[chain].getFakeUtxos({
        address,
        txid: randombytes(32).toString('hex'),
        vout: 0,
        satoshis: 124000000,
      });
      const balance = this.bitcoinUtils[chain].getUtxosBalance(utxos, address);
      const denomination = DENOMINATION[chain];
      const fees = SAT_PER_BYTE[chain];
      const needed =
        denomination +
        this.bitcoinUtils[chain].calculateFeeSat({
          users: 2,
          inputs: utxos.length,
          outputs: 2,
          fees,
        });
      const rate = 800; // Fixed
      return { address, balance, utxos, needed, fees, rate, chain };
    } else if (
      this.bitcoinUtils[chain] &&
      !this.bitcoinUtils[chain].isInvalid(address) &&
      DENOMINATION[chain] &&
      SAT_PER_BYTE[chain]
    ) {
      try {
        const utxos = await this.bitcoinUtils[chain].getUtxos(address);
        // this.logger[chain].log('Balance. Got utxos:', utxos);
        const balance = this.bitcoinUtils[chain].getUtxosBalance(
          utxos,
          address
        );
        const denomination =
          this.roundParams[chain].denomination || DENOMINATION[chain];
        const fees = this.roundParams[chain].fees || SAT_PER_BYTE[chain];
        const needed =
          denomination +
          this.bitcoinUtils[chain].calculateFeeSat({
            users: 2,
            inputs: utxos.length,
            outputs: 2,
            fees,
          });
        const rate = this.chainRates[chain];
        return { address, balance, needed, utxos, fees, rate, chain };
      } catch (err) {
        return {
          error: `Something went wrong checking balance: ${err.message}`,
          chain,
        };
      }
    } else {
      return { error: `Server does not support: ${chain}`, chain };
    }
  }

  async asyncSend(array, callback) {
    return await Promise.all(
      array.map(obj => {
        return new Promise(async resolve => {
          let res;
          try {
            res = await callback(obj);
          } catch (err) {
            this.logger.print(err);
          }
          resolve(res);
        });
      })
    );
  }

  async loopStart(chain) {
    clearTimeout(this.tstart[chain]);
    this.tstart[chain] = null;
    try {
      if (this.DEBUG_TEST_MODE) {
        await this.start({});
      } else {
        let progress = false;
        try {
          const res = await this.bitcoinUtils[chain].getInfo();
          progress = Math.floor(res.chain.progress * 100);
        } catch (err) {
          this.logger[chain].error(err.message);
          this.broadcastError(`Error: Could not connect to blockchain`, chain);
        }
        if (progress === 100) {
          await this.start({ chain });
        } else if (progress !== false) {
          const msg = `Syncing with blockchain ${chain}. ${progress}%`;
          this.logger[chain].log(msg);
          this.broadcastError(msg, chain);
        }
      }
    } catch (err) {
      this.logger[chain].error('LOOPSTART ERROR: ', err);
    }
    clearTimeout(this.tstart[chain]);
    this.tstart[chain] = setTimeout(() => {
      this.loopStart(chain);
    }, this.CONFIG.DELAY_BETWEEN_ROUNDS ? this.CONFIG.DELAY_BETWEEN_ROUNDS * 1000 : 10000); // Check to start every 10 seconds
  }

  async start({ chain }) {
    this.CONFIG = await Config.get(this.DEBUG_TEST_MODE);
    const min_pool = this.CONFIG.MIN_POOL[chain];
    const max_pool = this.CONFIG.MAX_POOL[chain];
    const fees = this.CONFIG.SAT_PER_BYTE[chain];
    const denomination = this.CONFIG.DENOMINATION[chain];
    if (!min_pool || !max_pool || !fees || !denomination) {
      throw new Error(`Invalid configuration: ${JSON.stringify(this.CONFIG)}`);
    }

    const connections = this.getConnections();
    this.alices[chain] = {};
    const round_id = randombytes(32).toString('base64');
    this.roundParams[chain] = {
      round_id,
      fees,
      min_pool,
      max_pool,
      denomination,
      chain,
      state: SERVER_STATES.join,
      version: SERVER_VERSION,
      joined: this.roundParams[chain].joined || 0,
    };
    await this.asyncSend(connections, async connection => {
      const res = await connection.join(this.roundParams[chain]);
      const obj = await this.join({
        ...res,
        connection,
        round_id,
        round_chain: chain,
      });
      if (obj && obj.error) {
        // this.logger[chain].print(obj.address, obj.error, obj.balance);
        if (
          obj.error !== 'Not enough bitcoin to join round' &&
          obj.error.indexOf('Out of date.') !== 0
        ) {
          this.logger[chain].print(obj.address || '', obj.error);
        }
        if (typeof connection.roundError === 'function') {
          connection.roundError({ ...obj, chain: res.chain });
        }
      } else if (obj) {
        if (typeof connection.balance === 'function') {
          connection.balance(obj);
        }
      }
    });
    const alices = this.getAlices(chain);
    this.roundParams[chain].joined = alices.length;
    const actualAlices = alices.reduce((previous, alice) => {
      return previous + (alice.min_pool <= alices.length ? 1 : 0);
    }, 0);
    if (actualAlices < min_pool) {
      return this.logger[chain].print(
        `Not enough alices to start: ${actualAlices} of ${min_pool} needed. ${
          alices.length
        } total. ${connections.length} connections`
      );
    }
    this.roundParams[chain].state = SERVER_STATES.shuffling;
    this.logger[chain].log(`Starting round with ${actualAlices} users`);
    const publicKeys = alices.map(alice => ({
      address: alice.fromAddress,
      verify: alice.verify,
      key: alice.publicKey,
    }));
    let onions = [];
    try {
      for (let i = 0; i < alices.length; i++) {
        const response = await alices[i].connection.shuffle({
          // publicKeys: publicKeys.slice(i + 1),
          publicKeys,
          onions,
          // index: i + 1,
        });

        if (response.onions && response.onions.length === i + 1) {
          onions = response.onions;
          alices[i].onions = response.onions; // Save for blame game
        } else {
          alices[i].onions = true;
          throw new Error(
            `Invalid shuffle response: ${JSON.stringify(response)}`
          );
        }
        this.logger[chain].log(`${alices[i].fromAddress} Shuffled`);
      }
    } catch (err) {
      await this.blameGame({ alices, chain });
      // await this.roundError(`Failed at shuffling: ${err.message}`);
      return;
    }
    const secubits = [];
    for (const onion of onions) {
      try {
        const toAddress = this.bitcoinUtils[chain].hexToAddress(onion);
        if (this.bitcoinUtils[chain].isInvalid(toAddress)) {
          throw new Error('Invalid toAddress');
        }
        secubits.push({ toAddress });
      } catch (err) {
        await this.blameGame({ alices, chain });
        // await this.roundError('Failed at shuffling 2');
        return;
      }
    }
    const txInfo = {
      alices: alices.map(alice => ({
        fromAddress: alice.fromAddress,
        changeAddress: alice.changeAddress,
      })),
      secubits,
      utxos: alices.reduce(
        (previous, alice) => previous.concat(alice.utxos),
        []
      ),
    };
    // this.logger[chain].log(txInfo);
    let tx;
    try {
      tx = this.bitcoinUtils[chain].createTransaction({
        alices: txInfo.alices,
        secubits,
        utxos: txInfo.utxos,
        fees,
        denomination,
        min_pool,
      }).tx;
    } catch (err) {
      this.logger[chain].error(err);
      await this.blameGame({ alices, chain });
      // await this.roundError(`Failed at creating tx: ${err.message}`);
      return;
    }

    let signedTxs;
    try {
      signedTxs = await Promise.all(
        alices.map(alice => {
          return new Promise(async (resolve, reject) => {
            try {
              const res = await alice.connection.sign(txInfo);
              if (!res || !res.tx) {
                throw new Error(
                  `Invalid signed tx response: ${JSON.stringify(res)}`
                );
              }
              alice.signedTx = res.tx; // TODO: Validate signed tx
              resolve(res.tx);
              this.logger[chain].log(`${alice.fromAddress} Signed TX`);
            } catch (err) {
              reject(err);
            }
          });
        })
      );
    } catch (err) {
      this.logger[chain].error(err);
      await this.blameGame({ alices, chain });
      // await this.roundError(`Failed at signing: ${err.message}`);
      return;
    }

    try {
      const { serialized, txid } = this.bitcoinUtils[chain].combineTxs({
        tx,
        signedTxs,
      });
      const { error } = await this.broadcastTx({ tx: serialized, chain });
      if (error) {
        throw new Error(error);
      }
      this.logger[chain].log(`Round Succeded with ${actualAlices} users`);
      await this.asyncSend(alices, async alice => {
        if (typeof alice.connection.roundSuccess === 'function') {
          await alice.connection.roundSuccess({ txid, serialized, chain });
        }
      });
    } catch (err) {
      this.logger[chain].error(err);
      await this.blameGame({ alices, chain, fault: err.addresses });
      // await this.roundError(
      //   `Failed at combining and broadcasting tx: ${err.message}`
      // );
      return;
    }
    return true;
  }
  async broadcastTx({ tx, chain }) {
    if (this.DEBUG_TEST_MODE) {
      this.logger[chain].log('Did not Broadcasted Tx (Debug mode)', tx);
      return {};
    } else if (chain && this.bitcoinUtils[chain]) {
      try {
        const { addresses, utxos } = await this.bitcoinUtils[chain].validateTx(
          tx
        );
        this.logger[chain].log('Tx Validated. Broadcasting Tx...', tx);
        const res = await this.bitcoinUtils[chain].broadcastTx(tx);
        this.logger[chain].log('Broadcasted Tx', res);
        const txid = res.result;
        await new Promise(resolve => setTimeout(() => resolve()), 1 * 1000); // Wait 1 second

        try {
          await this.bitcoinUtils[chain].validateTxUtxosAfterBroadcast({
            addresses,
            utxos,
          });
          this.logger[chain].log('Broadcasted Tx utxo verified');
        } catch (err) {
          this.logger[chain].error('Broadcasted Tx verify utxo error', err);
        }
        try {
          await this.bitcoinUtils[chain].validateTxidAfterBroadcast({ txid });
        } catch (err) {
          this.logger[chain].error('Broadcasted Tx verify tx error', err);
        }
        return { txid, ...res };
      } catch (err) {
        this.logger[chain].error(`Tx is invalid: ${err.message}`);
        this.logger[chain].print(err);
        return {
          error: `Could not send tx: ${err.message}`,
          addresses: err.addresses,
        };
      }
    } else {
      this.logger.log('Broadcast Tx does not support chain:', chain);
      return { error: `Server does not support chain ${chain}` };
    }
  }

  async join({
    round_id,
    fromAddress,
    changeAddress,
    publicKey,
    verify,
    verifyJoin,
    connection,
    min_pool,
    version,
    chain,
    round_chain,
    error,
  }) {
    if (error) {
      if (error !== 'Wrong chain') {
        this.logger[round_chain].log('Client responded with error: ', error);
      }
      return;
    }
    if (version !== SERVER_VERSION) {
      this.logger[round_chain].print('Client out of date', version);
      return { error: `Out of date. Update to version ${SERVER_VERSION}` };
    }
    if (!this.bitcoinUtils[chain]) {
      this.logger.print(`Server does not support ${chain}`);
      return { error: `Server does not support ${chain}` };
    }
    if (chain !== round_chain) {
      return; // Ignore
    }
    if (
      this.bitcoinUtils[chain].isInvalid(fromAddress) ||
      this.bitcoinUtils[chain].isInvalid(changeAddress)
    ) {
      return { error: 'Invalid addresses' };
    }
    if (
      this.ENFORCE_PUNISHMENT &&
      this.punishedUsers[fromAddress] &&
      this.punishedUsers[fromAddress] >= this.PUNISH_BAN_LIMIT
    ) {
      return { error: 'You have been banned' };
    }
    if (!publicKey) {
      return { error: 'Missing publicKey' };
    }
    if (publicKey.length !== this.PUBLIC_KEY_LENGTH) {
      return { error: 'Invalid public key length' };
    }
    if (
      !this.bitcoinUtils[chain].verifyMessage(round_id, fromAddress, verifyJoin)
    ) {
      return { error: 'Invalid round_id validation' };
    }
    if (
      !this.bitcoinUtils[chain].verifyMessage(
        sha256(publicKey),
        fromAddress,
        verify
      )
    ) {
      return { error: 'Invalid key validation' };
    }
    if (this.getAlices(chain).length >= this.roundParams[chain].max_pool) {
      return { error: 'Too many Alices' };
    }
    const response = await this.balance({ address: fromAddress, chain });
    const { balance, utxos, needed } = response;
    if (response.error) {
      return response;
    } else if (balance < needed) {
      return { ...response, error: 'Not enough bitcoin to join round' };
    }
    if (!this.alices[chain][fromAddress]) {
      this.logger[chain].print(`User joined: ${fromAddress}`);
    }
    this.alices[chain][fromAddress] = {
      fromAddress,
      changeAddress,
      publicKey,
      verify,
      utxos,
      connection,
      min_pool,
    };
    return { address: fromAddress, balance, needed };
  }

  async blameGame({ alices, chain, fault }) {
    // TODO: Filter request/disconnect timeouts first
    let punish = [];
    if (fault && fault.length > 0) {
      punish = fault;
    }

    let responses;
    if (punish.length === 0) {
      // this.logger[chain].error('Starting Blame Game');
      responses = await this.asyncSend(alices, async alice => {
        try {
          const res = await alice.connection.blame();
          return { ...res, alice };
        } catch (err) {
          return { alice };
        }
      });
      for (const res of responses) {
        if (
          !res.privateKey ||
          !res.toAddress ||
          this.bitcoinUtils[chain].isInvalid(res.toAddress) ||
          !Shuffle.validateKeys(res.alice.publicKey, res.privateKey)
        ) {
          punish.push(res.alice.fromAddress);
        }
      }
    }
    if (punish.length === 0) {
      let previousOnions = {};
      for (let i = 0; i < responses.length; i++) {
        const user = responses[i];
        try {
          // TODO: Unwrap onions to determine user who stopped round
          const nextOnions = {};
          // 1. Skim first layer off. Save for next user
          // 2. Remove previous matches from last
          // 3. Peel last onion to final toAddress to verify
          if (!user.alice.onions) {
            // Round never made it this far
            break;
          }
          if (user.alice.onions === true) {
            throw new Error('User didnt send onions');
          }
          if (user.alice.onions.length !== i + 1) {
            throw new Error('Invalid number of onions');
          }
          try {
            for (let onion of user.alice.onions) {
              if (i + 1 < responses.length) {
                const nextPrivKey = responses[i + 1].privateKey;
                onion = Shuffle.decrypt(nextPrivKey, onion);
              }
              nextOnions[onion] = true;
            }
          } catch (err) {
            err.breakForLoop = true;
            throw err;
          }
          if (Object.keys(nextOnions).length !== user.alice.onions.length) {
            const error = new Error('Duplicate onions');
            error.breakForLoop = true;
            throw error;
          }
          let usersOnion;
          // 2. Remove previous onions seen in last user shuffle
          for (let onion of user.alice.onions) {
            if (!previousOnions[onion]) {
              if (usersOnion) {
                throw new Error('Multiple users onions');
              }
              usersOnion = onion;
            }
          }
          if (!usersOnion) {
            throw new Error('Missing users onion');
          }

          try {
            for (let j = i + 1; j < responses.length; j++) {
              const nextPrivKey = responses[j].privateKey;
              usersOnion = Shuffle.decrypt(nextPrivKey, usersOnion);
            }
            const toAddress = this.bitcoinUtils[chain].hexToAddress(usersOnion);
            if (this.bitcoinUtils[chain].isInvalid(toAddress)) {
              throw new Error('Invalid toAddress');
            }
          } catch (err) {
            err.breakForLoop = true;
            throw err;
          }
          previousOnions = nextOnions;
        } catch (err) {
          this.logger[chain].error(err);
          punish.push(user.alice.fromAddress);
          if (err.breakForLoop) {
            break;
          }
        }
      }
    }
    // Check for signed tx's
    if (punish.length === 0) {
      for (const res of responses) {
        // TODO: Validate signedTx
        if (!res.alice.signedTx) {
          punish.push(res.alice.fromAddress);
        }
      }
    }
    if (punish.length < alices.length) {
      for (const address of punish) {
        this.punishedUsers[address] = (this.punishedUsers[address] || 0) + 1;
      }
    } else {
      this.logger[chain].error(`Will not punish all users`);
    }

    const error = `Round failed at state: ${this.roundParams[chain].state}`;
    this.logger[chain].error('Blame Game:', error, 'Punishing users:', punish);
    await this.asyncSend(alices, async alice => {
      if (typeof alice.connection.roundSuccess === 'function') {
        await alice.connection.roundSuccess({ error, chain });
      }
      if (typeof alice.connection.roundError === 'function') {
        await alice.connection.roundError({ error, chain });
      }
    });
  }
}

module.exports = Coordinator;
