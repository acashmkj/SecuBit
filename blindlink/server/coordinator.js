const BlindSignature = require('blind-signatures');
const SERVER_VERSION = require('../../package.json').version;
const SERVER_STATES = require('../client/server_states');
const path = require('path');
let consoleLog = {
  info: (...msg) => console.log('SERVER: ', ...msg),
  warn: (...msg) => console.log('SERVER: ', ...msg),
  error: (...msg) => console.log('SERVER: ', ...msg),
  log: (...msg) => console.log('SERVER: ', ...msg),
};

const CHECKIN_TIMEOUT = 30 * 1000; // Assume user is out if they haven't checked in in 30 seconds
const CHECK_FOR_TIMEOUTS = 3 * 1000; // Every 3 seconds check if alice timed out
const BLINDING_TIMEOUT = 30 * 1000;
const dOUTPUTS_TIMEOUT = 30 * 1000;
const dSIGNING_TIMEOUT = 30 * 1000;
const dBLAME_TIMEOUT = 30 * 1000;
const MAX_ROUND_HISTORY = 30;
const AUTO_START_DELAY = 10 * 1000;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class Coordinator {
  constructor({
    bitcoinUtils,
    CHAIN = 'testnet',
    DISABLE_BROADCAST = false,
    DISABLE_UTXO_FETCH = false,
    DISABLE_BALANCE_CHECK = true,
    MIN_POOL = 2,
    MAX_POOL = 1000,
    OUTPUT_SAT = 100000,
    FEE_PER_INPUT = 1000,
    RSA_KEY_SIZE = 1024,
    OUTPUT_URL,
    LOG_TO_FILE = false,
    OUTPUTS_TIMEOUT = dOUTPUTS_TIMEOUT,
    BLAME_TIMEOUT = dBLAME_TIMEOUT,
    SIGNING_TIMEOUT = dSIGNING_TIMEOUT,
  }) {
    if (LOG_TO_FILE) {
      consoleLog = require('simple-node-logger').createSimpleLogger({
        logFilePath: path.join(__dirname, '../../logs/coordinator.log'),
        timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      });
    }
    this.bitcoinUtils = bitcoinUtils;
    this.completedRounds = {};
    this.LOG_TO_FILE = LOG_TO_FILE;
    this.OUTPUT_URL = OUTPUT_URL;
    this.CHAIN = CHAIN;
    this.DISABLE_BROADCAST = DISABLE_BROADCAST;
    this.DISABLE_UTXO_FETCH = DISABLE_UTXO_FETCH;
    this.DISABLE_BALANCE_CHECK = DISABLE_BALANCE_CHECK;
    this.MIN_POOL = MIN_POOL;
    this.MAX_POOL = MAX_POOL;
    this.OUTPUT_SAT = OUTPUT_SAT;
    this.FEE_PER_INPUT = FEE_PER_INPUT;
    this.RSA_KEY_SIZE = RSA_KEY_SIZE;
    this.OUTPUTS_TIMEOUT = OUTPUTS_TIMEOUT;
    this.BLAME_TIMEOUT = BLAME_TIMEOUT;
    this.SIGNING_TIMEOUT = SIGNING_TIMEOUT;
    this.punishedAddresses = {}; // TODO: Persist
    this.initRound();
  }
  getAlices() {
    return Object.keys(this.alices).map(key => this.alices[key]);
  }
  getSecuBits() {
    return Object.keys(this.secubits).map(key => this.secubits[key]);
  }
  exit() {
    this.initRound();
    clearTimeout(this.tcheck);
  }

  initRound() {
    clearTimeout(this.tautoStartRounds);
    clearTimeout(this.tblindingTimeout);
    clearTimeout(this.toutputTimeout);
    clearTimeout(this.tsigningTimeout);
    this.tautoStartRounds = null;
    this.key = BlindSignature.keyGeneration({ b: this.RSA_KEY_SIZE });
    this.keyParameters = {
      N: this.key.keyPair.n.toString(),
      E: this.key.keyPair.e.toString(),
    };
    this.roundInfo = {
      chain: this.CHAIN,
      min_pool: this.MIN_POOL,
      max_pool: this.MAX_POOL,
      fees: this.FEE_PER_INPUT,
      denomination: this.OUTPUT_SAT,
      version: SERVER_VERSION,
      preverify: uuidv4(),
      url: this.OUTPUT_URL,
    };
    this.round_id = uuidv4();
    this.alices = {};
    this.secubits = {};
    this.blockRace = {};
    this.transaction = null;
    this.finalTransaction = null;
    this.roundState = SERVER_STATES.join;
    this.checkForInactive();
    consoleLog.info('-------------Started Round-------------');
  }

  state() {
    return {
      ...this.roundInfo,
      state: this.roundState,
      alices: this.getAlices().length,
      // secubits: this.getSecuBits().length,
    };
  }

  checkin({ fromAddress, uuid }) {
    let joined = false;
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (
      fromAddress &&
      uuid &&
      this.alices[fromAddress] &&
      this.alices[fromAddress].uuid === uuid
    ) {
      this.alices[fromAddress].checkinDate = new Date().getTime();
      joined = true;
    }

    return { joined };
  }

  checkForInactive() {
    clearTimeout(this.tcheck);
    this.tcheck = setTimeout(() => {
      if (this.roundState === SERVER_STATES.join) {
        // Check for user timeouts
        const alices = this.getAlices();
        alices.map(alice => {
          if (alice.checkinDate < new Date().getTime() - CHECKIN_TIMEOUT) {
            // Alice timed out
            consoleLog.info(`${alice.fromAddress} timed out`);
            delete this.alices[alice.fromAddress];
          }
        });
      }
      this.checkForInactive();
    }, CHECK_FOR_TIMEOUTS);
  }

  unjoin({ fromAddress, uuid }) {
    if (this.roundState !== SERVER_STATES.join) {
      return { ok: true };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (
      fromAddress &&
      uuid &&
      this.alices[fromAddress] &&
      this.alices[fromAddress].uuid === uuid
    ) {
      delete this.alices[fromAddress];
      consoleLog.info(`Unjoined Alice: ${fromAddress}`);
    } else {
      // return { error: 'Invalid alice' };
    }
    return { ok: true };
  }

  async join({ utxos, fromAddress, changeAddress, verify, min_pool }) {
    if (
      this.bitcoinUtils.isInvalid(fromAddress) ||
      this.bitcoinUtils.isInvalid(changeAddress)
    ) {
      return { error: 'Invalid address' };
    }
    if (
      !this.bitcoinUtils.verifyMessage(
        this.roundInfo.preverify,
        fromAddress,
        verify
      )
    ) {
      return { error: 'Invalid key validation' };
    }
    if (this.blockRace[fromAddress]) {
      return { error: 'Too many requests' };
    }
    if (this.alices[fromAddress]) {
      return this.alices[fromAddress].joinResponse;
    }

    if (!this.DISABLE_UTXO_FETCH) {
      utxos = []; // Only accept server validated utxos
      this.blockRace[fromAddress] = true; // For race condition
      try {
        utxos = await this.bitcoinUtils.getUtxos(fromAddress);
        delete this.blockRace[fromAddress]; // For race condition
      } catch (err) {
        delete this.blockRace[fromAddress]; // For race condition
        consoleLog.error(`Could not get utxos for ${fromAddress}`, err);
        return { error: 'Could not get utxos' };
      }
    }

    // consoleLog.info('UTXOS', utxos);
    let balance;
    try {
      balance = this.bitcoinUtils.getUtxosBalance(utxos, fromAddress);
      if (
        isNaN(balance) ||
        balance <
          this.roundInfo.denomination + utxos.length * this.roundInfo.fees
      ) {
        throw new Error('Balance too low');
      }
    } catch (err) {
      // consoleLog.info('Not enough value', err.message);
      return {
        error: 'Not enough Bitcoin in your Wallet',
        address: fromAddress,
        balance,
      };
    }
    if (this.roundState !== SERVER_STATES.join) return { error: 'Wrong state' };
    if (this.getAlices().length >= this.roundInfo.max_pool) {
      return { error: 'Max participants' };
    }

    const uuid = uuidv4(); // Assign user a uuid
    const joinResponse = {
      ...this.roundInfo,
      uuid,
      N: this.keyParameters.N,
      E: this.keyParameters.E,
      utxos,
    };
    this.alices[fromAddress] = {
      fromAddress,
      changeAddress,
      utxos,
      uuid,
      joinDate: new Date().getTime(),
      checkinDate: new Date().getTime(),
      joinResponse,
      min_pool,
    };
    const minPoolRound = this.roundInfo.min_pool;

    const alices = this.getAlices();
    const numAlices = alices.length;
    consoleLog.info(
      `1: #${numAlices} Participant joined ${fromAddress} with ${balance} SAT and ${
        utxos.length
      } inputs. min_pool: ${min_pool}`
    );
    const minPoolAlices = alices.filter(
      alice => !alice.min_pool || alice.min_pool <= alices.length
    ).length;
    if (!this.tautoStartRounds && minPoolAlices >= minPoolRound) {
      consoleLog.info(
        `Met Minimum Alices. Auto Starting Round in ${AUTO_START_DELAY /
          1000} seconds...`
      );
      clearTimeout(this.tautoStartRounds);
      this.tautoStartRounds = setTimeout(
        () => this.forceStart(),
        AUTO_START_DELAY
      );
    }
    return joinResponse;
  }

  forceStart() {
    if (this.roundState !== SERVER_STATES.join) {
      consoleLog.warn(`Invalid state for forceStart(). ${this.roundState}`);
      return;
    }
    clearTimeout(this.tautoStartRounds);
    this.tautoStartRounds = null;
    const alices = this.getAlices();
    const alicesFitMinPool = alices.filter(
      alice => !alice.min_pool || alice.min_pool <= alices.length
    );
    if (alicesFitMinPool.length < this.roundInfo.min_pool) {
      consoleLog.info(
        `Not enough alices to start round. ${alicesFitMinPool.length} need ${
          this.roundInfo.min_pool
        }`
      );
      return;
    }
    if (alicesFitMinPool.length !== alices.length) {
      const alicesRemoved = alices.filter(
        alice => alice.min_pool > alices.length
      );
      alicesRemoved.map(alice => {
        consoleLog.info(
          `Removing alice ${alice.fromAddress}. Their min_pool ${
            alice.min_pool
          } is higher than ${this.roundInfo.min_pool}`
        );
        delete this.alices[alice.fromAddress];
      });
    }
    this.roundState = SERVER_STATES.blinding;
    clearTimeout(this.tblindingTimeout);
    this.tblindingTimeout = setTimeout(
      () => this.blindingTimeout(),
      BLINDING_TIMEOUT
    );
  }

  blinding({ fromAddress, uuid, toAddressBlinded }) {
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'You have not joined' };
    }
    if (this.roundState !== SERVER_STATES.blinding) {
      return { error: 'Wrong state' };
    }
    if (this.alices[fromAddress].signed) {
      return { error: 'You have already blinded' };
    }
    const signed = BlindSignature.sign({
      blinded: toAddressBlinded,
      key: this.key,
    }).toString();
    this.alices[fromAddress].signed = true;
    if (this.getAlices().filter(alice => !alice.signed).length === 0) {
      // All alices signed. Next stage outputs
      this.roundState = SERVER_STATES.outputs;
      clearTimeout(this.tblindingTimeout);
      clearTimeout(this.toutputTimeout);
      this.toutputTimeout = setTimeout(
        () => this.outputsTimeout(),
        this.OUTPUTS_TIMEOUT
      );
    }
    return { signed };
  }

  outputs({ unblinded, toAddress, proof }) {
    if (this.roundState !== SERVER_STATES.outputs) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(toAddress)) {
      return { error: 'Invalid address' };
    }
    if (this.secubits[toAddress]) {
      return { error: 'Already registered output address' };
    }
    if (this.getSecuBits().length >= this.getAlices().length) {
      return { error: 'Something went wrong' };
    }

    const result = BlindSignature.verify2({
      unblinded,
      message: toAddress,
      key: this.key,
    });
    if (!result) {
      consoleLog.warn(`2: Invalid signature ${toAddress}`);
      return { error: 'Invalid signature' };
    }
    let signed;
    try {
      signed = BlindSignature.sign({
        blinded: proof,
        key: this.key,
      }).toString();
    } catch (err) {
      consoleLog.error(`2. Could not sign proof`, proof);
    }

    this.secubits[toAddress] = {
      toAddress,
      // unblinded,
    };
    consoleLog.info(`2: Registered output address ${toAddress}`);

    const alices = this.getAlices();
    const secubits = this.getSecuBits();
    if (!this.transaction && alices.length === secubits.length) {
      // setImmediate(() => {
      const utxos = alices.reduce(
        (previous, alice) => previous.concat(alice.utxos),
        []
      );
      const { fees, min_pool, denomination } = this.roundInfo;
      const { tx } = this.bitcoinUtils.createTransaction({
        utxos,
        alices,
        secubits,
        fees,
        denomination,
        min_pool,
      });
      this.finalTransaction = tx;
      this.transaction = {
        alices: alices.map(alice => ({
          fromAddress: alice.fromAddress,
          changeAddress: alice.changeAddress,
        })),
        secubits: secubits.map(secubit => ({
          toAddress: secubit.toAddress,
        })),
        utxos,
      };
      this.roundState = SERVER_STATES.signing;
      clearTimeout(this.toutputTimeout);
      clearTimeout(this.tsigningTimeout);
      this.tsigningTimeout = setTimeout(
        () => this.signingTimeout(),
        this.SIGNING_TIMEOUT
      );
      // });
    }
    return { signed };
  }

  gettx({ fromAddress, uuid }) {
    if (this.roundState !== SERVER_STATES.signing) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'Not joined' };
    }
    if (this.alices[fromAddress].txReceived) {
      return { error: 'Already received tx' };
    }
    const transaction = this.transaction;
    if (transaction) {
      consoleLog.info(`3: Sent unsigned transaction to ${fromAddress}`);
      this.alices[fromAddress].txReceived = true;
      return transaction;
    } else {
      return { error: 'No TX' }; // Should not happen
    }
  }

  async txsignature({ fromAddress, uuid, txSigned }) {
    if (this.roundState !== SERVER_STATES.signing) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'Not joined' };
    }
    if (this.alices[fromAddress].txSigned) {
      return { error: 'Already signed' };
    }
    if (txSigned.inputs.length !== this.finalTransaction.inputs.length) {
      return { error: 'Inputs dont match' };
    }
    if (txSigned.outputs.length !== this.finalTransaction.outputs.length) {
      return { error: 'Outputs dont match' };
    }
    if (!txSigned) {
      return { error: 'No signed inputs' };
    }
    this.alices[fromAddress].txSigned = txSigned;
    consoleLog.info(`4: Received signed transaction for ${fromAddress}`);

    const round_id = this.round_id;
    const alices = this.getAlices();
    const secubits = this.getSecuBits();
    const numSigned = alices.reduce(
      (previous, alice) => (alice.txSigned ? previous + 1 : previous),
      0
    );
    if (
      numSigned === alices.length &&
      alices.length >= this.roundInfo.min_pool &&
      alices.length === secubits.length
    ) {
      clearTimeout(this.tsigningTimeout);
      setImmediate(async () => {
        try {
          if (!this.DISABLE_UTXO_FETCH) {
            // Re-check all utxos
            const fromAddresses = this.transaction.alices.map(
              alice => alice.fromAddress
            );
            const utxos = await this.bitcoinUtils.getUtxos(fromAddresses);
            try {
              this.bitcoinUtils.compareUtxoSets(this.transaction.utxos, utxos);
            } catch (err) {
              consoleLog.error(`Invalid utxos`, err);
              this.utxoSetChanged(err.data);
              return;
            }
          }
          const signedTxs = alices.map(alice => alice.txSigned);
          const { serialized, txid } = this.bitcoinUtils.combineTxs({
            tx: this.finalTransaction,
            signedTxs,
          });
          consoleLog.info(`Broadcasting transaction... ${serialized}`);
          if (!this.DISABLE_BROADCAST) {
            const txid = await this.bitcoinUtils.broadcastTx(serialized);
            consoleLog.info(`Broadcasted transaction! ${txid}`);
          }
          this.completedRounds[round_id] = {
            success: true,
            round_id,
            date: new Date().getTime(),
            response: {
              serialized,
              txid,
              secubits: secubits.length,
            },
          };
        } catch (err) {
          consoleLog.error('Error combining TX', err);
          // TODO: Blame game
          this.completedRounds[round_id] = {
            success: false,
            error: `Error creating final tx: ${err.message}`,
            round_id,
            date: new Date().getTime(),
          };
        }

        const completedRounds = Object.keys(this.completedRounds).map(
          key => this.completedRounds[key]
        );
        if (completedRounds.length > MAX_ROUND_HISTORY) {
          // Prune old completedRounds
          let oldest = { key: '', date: new Date().getTime() };
          completedRounds.map(round => {
            if (round.date < oldest.date) {
              oldest = {
                key: round.round_id,
                date: round.date,
              };
            }
          });
          if (oldest.key) {
            delete this.completedRounds[oldest.key];
            consoleLog.info(`Pruned old round history: ${oldest.key}`);
          }
        }
        this.initRound();
      });
    }
    return { round_id };
  }

  verify({ round_id }) {
    if (!round_id || !this.completedRounds[round_id]) {
      return { error: 'Invalid Round ID' };
    } else {
      if (this.completedRounds[round_id].success) {
        return { tx: this.completedRounds[round_id].response };
      } else {
        return { error: this.completedRounds[round_id].error };
      }
    }
  }

  async publicUtxo({ address, uuid }) {
    if (!this.DISABLE_BALANCE_CHECK) {
      // Allow user to only check balance once per round
      if (address.length <= 0 || address.length > 2) {
        return { error: 'Too many addresses' };
      }
      if (
        address.filter(addr => this.bitcoinUtils.isInvalid(addr)).length !== 0
      ) {
        return { error: 'Invalid address' };
      }
      let verified = false;
      let joinedRound = false;
      address.map(addr => {
        if (this.alices[addr] && this.alices[addr].uuid === uuid) {
          joinedRound = true;
          if (!this.alices[addr].checkedBalances) {
            verified = true;
            this.alices[addr].checkedBalances = true;
          }
        }
      });
      if (verified) {
        const utxos = await this.bitcoinUtils.getUtxos(address);
        return { utxos };
      }
      if (joinedRound && !verified) {
        return { error: 'Already checked balance' };
      } else {
        return { error: 'Must join round' };
      }
    } else {
      return { error: 'Disabled' };
    }
  }

  proof({ fromAddress, uuid, proof }) {
    if (this.roundState !== SERVER_STATES.blamegame) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'Not joined' };
    }
    if (this.alices[fromAddress].proved) {
      return { ok: true }; // Already proved
    }
    try {
      const result = BlindSignature.verify2({
        unblinded: proof,
        message: uuid,
        key: this.key,
      });
      if (!result) throw new Error('Invalid signature');
      // User verified
      this.alices[fromAddress].proved = true;
      if (this.getAlices().filter(alice => !alice.proved).length === 1) {
        // Everyone proved except the last person who caused the timeout
        this.outputTimeoutComplete();
      }
    } catch (err) {
      consoleLog.warn(`BlameGame: Invalid proof ${proof}`);
      return { error: 'Invalid signature' };
    }
    return { ok: true };
  }

  blindingTimeout() {
    consoleLog.warn('Blinding state timed out');
    // TODO: Just remove alices and keep going if over min?
    const addresses = this.getAlices()
      .filter(alice => !alice.signed)
      .map(alice => alice.fromAddress);
    this.punishAddresses(addresses);

    const round_id = this.round_id;
    this.completedRounds[round_id] = {
      success: false,
      error: 'Timed out on Blinding state',
      round_id,
      date: new Date().getTime(),
    };
    this.initRound();
  }
  outputsTimeout() {
    consoleLog.warn('Output state timed out');
    this.roundState = SERVER_STATES.blamegame;
    clearTimeout(this.tblameTimeout);
    this.tblameTimeout = setTimeout(
      () => this.outputTimeoutComplete(),
      this.BLAME_TIMEOUT
    );
  }
  outputTimeoutComplete() {
    clearTimeout(this.tblameTimeout);
    const addresses = this.getAlices()
      .filter(alice => !alice.proved)
      .map(alice => alice.fromAddress);
    this.punishAddresses(addresses);

    const round_id = this.round_id;
    this.completedRounds[round_id] = {
      success: false,
      error: 'Timed out on Outputs state',
      round_id,
      date: new Date().getTime(),
    };
    this.initRound();
  }
  signingTimeout() {
    consoleLog.warn('Signing state timed out');
    const addresses = this.getAlices()
      .filter(alice => !alice.txSigned)
      .map(alice => alice.fromAddress);
    this.punishAddresses(addresses);

    const round_id = this.round_id;
    this.completedRounds[round_id] = {
      success: false,
      error: 'Timed out on Signing state',
      round_id,
      date: new Date().getTime(),
    };
    this.initRound();
  }
  utxoSetChanged(addresses) {
    // A user changed their utxo set (possible double spend)
    consoleLog.warn('User changed their utxo set', addresses);
    this.punishAddresses(addresses);

    const round_id = this.round_id;
    this.completedRounds[round_id] = {
      success: false,
      error: 'User changed their utxo set',
      round_id,
      date: new Date().getTime(),
    };
    this.initRound();
  }
  punishAddresses(addresses) {
    const alices = this.getAlices();
    if (addresses.length === alices.length) {
      // Don't punish if every user failed. Probably server connection
      consoleLog.warn(`Punishing Addresses: All users. Ignoring`);
    } else if (addresses.length > 0) {
      consoleLog.warn(`Punishing Addresses: ${addresses.join(', ')}`);
      // TODO: complete
      addresses.map(address => {
        this.punishedAddresses[address] =
          (this.punishedAddresses[address] || 0) + 1;
      });
    } else {
      consoleLog.error(`Punishing Addresses: MISSING`);
      // TODO: This shouldn't happen
    }
  }

  async mockFetch(url, body) {
    body = body ? JSON.parse(JSON.stringify(body)) : undefined;
    // console.log(url, body);
    console.log(url);
    let res;
    if (url === '/state') {
      res = this.state();
    } else if (url === '/checkin') {
      res = this.checkin(body);
    } else if (url === '/join') {
      res = await this.join(body);
    } else if (url === '/unjoin') {
      res = this.unjoin(body);
    } else if (url === '/blinding') {
      res = this.blinding(body);
    } else if (url === '/outputs') {
      res = this.outputs(body);
    } else if (url === '/gettx') {
      res = this.gettx(body);
    } else if (url === '/txsignature') {
      res = await this.txsignature(body);
    } else if (url === '/verify') {
      res = await this.verify(body);
    } else if (url === '/utxo') {
      res = await this.publicUtxo(body);
    } else if (url === '/proof') {
      res = await this.proof(body);
    }
    res = JSON.parse(JSON.stringify(res));
    return res;
  }
  wait(delay) {
    return new Promise(resolve => setTimeout(() => resolve(), delay));
  }
}

module.exports = Coordinator;
