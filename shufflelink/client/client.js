const Shuffle = require('./shuffle');
const sha256 = require('js-sha256');
const CLIENT_STATES = require('./client_states');

class Client {
  constructor({
    bitcoinUtils,

    aliceSeed,
    secubitSeed,
    aliceIndex = 0,
    secubitIndex = 0,
    changeIndex = 1,

    chain = 'tBTC',
    min_pool = 2,
    max_fees = 100,
    min_denomination = 1000,
    max_denomination = 2100000000000000,
    version = 'unknown',

    callbackStateChange,
    callbackError,
    callbackRoundComplete,
    callbackBalance,
  }) {
    this.chain = chain;
    this.version = version;
    this.bitcoinUtils = bitcoinUtils;

    this.callbackStateChange = callbackStateChange;
    this.callbackError = callbackError;
    this.callbackRoundComplete = callbackRoundComplete;
    this.callbackBalance = callbackBalance;

    if (!aliceSeed || !secubitSeed) {
      throw new Error('Missing wallet seeds');
    }

    this.aliceSeed = aliceSeed;
    this.secubitSeed = secubitSeed;
    this.aliceIndex = aliceIndex;
    this.secubitIndex = secubitIndex;
    this.changeIndex = changeIndex;

    this.min_pool = min_pool;
    this.max_fees = max_fees;
    this.min_denomination = min_denomination;
    this.max_denomination = max_denomination;
    this.roundProgress = 0;
    this.roundError = null;
    this.roundState = CLIENT_STATES.unjoined;
    this.updateKeyIndexes({ aliceIndex, secubitIndex, changeIndex });
  }
  setState(state) {
    if (state === this.roundState) return; // Ignore
    this.roundState = state;
    this.roundProgress = state / (Object.keys(CLIENT_STATES).length - 1);
    if (this.callbackStateChange) this.callbackStateChange(state);
  }
  getState() {
    const reverse = {};
    Object.keys(CLIENT_STATES).map(key => (reverse[CLIENT_STATES[key]] = key));
    return reverse[this.roundState];
  }
  updateKeyIndexes({
    aliceIndex = this.aliceIndex,
    secubitIndex = this.secubitIndex,
    changeIndex,
  }) {
    this.aliceIndex = aliceIndex === '' ? 0 : aliceIndex;
    this.secubitIndex = secubitIndex === '' ? 0 : secubitIndex;
    this.keys = this.bitcoinUtils.generateAddresses({
      aliceSeed: this.aliceSeed,
      secubitSeed: this.secubitSeed,
      aliceIndex: this.aliceIndex,
      secubitIndex: this.secubitIndex,
      changeIndex: changeIndex === '' ? 0 : changeIndex,
    });
    this.changeIndex = this.keys.changeIndex;
  }
  getAddresses() {
    return Object.assign({}, this.keys, {
      fromPrivate: undefined,
      toPrivate: undefined,
    });
  }
  getRoundInfo() {
    const { roundError, roundProgress, roundParams } = this;
    return Object.assign({}, this.getAddresses(), roundParams, {
      roundError,
      progress: roundProgress,
      currentState: this.getState(),
    });
  }
  setRoundError(err) {
    if (!err || err.chain === this.chain) {
      this.roundError = err;
      // this.setState(CLIENT_STATES.unjoined);
      if (this.callbackError) this.callbackError(err);
    }
  }
  roundSuccess(response = {}) {
    if (response.chain === this.chain) {
      if (!response.error) {
        // Success
        // Increment addresses

        if (this.aliceIndex !== this.changeIndex) {
          this.aliceIndex = this.changeIndex;
          this.changeIndex++;
        }
        this.secubitIndex++;

        this.updateKeyIndexes({ changeIndex: this.changeIndex });
      } else if (this.roundParams.blameGame) {
        // TODO: Increment secubitIndex if round entered blame game and sent private key
        // this.secubitIndex++;
        // this.updateKeyIndexes({ changeIndex: this.changeIndex });
      }
      this.setState(CLIENT_STATES.unjoined);
      const finalParams = this.filterFinalParameters(
        this.roundParams,
        response
      );
      if (this.callbackRoundComplete) this.callbackRoundComplete(finalParams);
    }
  }
  updateBalance(response) {
    if (this.callbackBalance) this.callbackBalance(response);
  }
  filterFinalParameters(
    {
      keys: { toAddress, fromAddress, changeAddress, secubitIndex },
      denomination,
      totalChange,
      totalFees,
      secubits,
      blameGame,
      index,
    },
    { txid, serialized, error }
  ) {
    return {
      error,
      blame: blameGame,
      to: toAddress,
      from: fromAddress,
      change: changeAddress,
      out: denomination,
      left: totalChange,
      fees: totalFees,
      serialized,
      secubits,
      index,
      txid,
      secubitIndex,
      date: new Date().getTime(),
    };
  }

  join(params) {
    const chain = this.chain;
    if (params.chain !== chain) {
      return { error: 'Wrong chain', chain };
    }
    if (params.fees > this.max_fees) {
      return { error: 'Fees are too high', chain };
    }
    if (params.denomination < this.min_denomination) {
      return { error: 'Denomination too low', chain };
    }
    if (params.denomination > this.max_denomination) {
      return { error: 'Denomination too high', chain };
    }
    this.setRoundError(); // Clear round error
    this.setState(CLIENT_STATES.joining);
    const rsaKey = Shuffle.generateKey();
    this.roundParams = Object.assign({}, params, {
      publicKey: rsaKey.getPublicKey(),
      privateKey: rsaKey.getPrivateKey(),
      keys: this.keys,
      lastUpdated: new Date().getTime(),
      chain,
      version: this.version,
    });
    const {
      publicKey,
      round_id,
      version,
      keys: { fromAddress, changeAddress, fromPrivate },
    } = this.roundParams;
    return {
      chain,
      version,
      fromAddress,
      changeAddress,
      publicKey,
      min_pool: this.min_pool,
      verify: this.bitcoinUtils.signMessage(sha256(publicKey), fromPrivate),
      verifyJoin: this.bitcoinUtils.signMessage(round_id, fromPrivate),
    };
  }

  shuffle({ publicKeys, onions }) {
    try {
      if (publicKeys.length < this.min_pool) {
        return { error: `Must have at least ${this.min_pool} users in round.` };
      }
      // if (this.roundState !== CLIENT_STATES.joining) return;
      this.setState(CLIENT_STATES.shuffling);
      const {
        privateKey,
        keys: { toAddress, fromAddress },
      } = this.roundParams;
      // Validate public keys
      let index = -1;
      this.roundParams.inputAddresses = {};
      this.roundParams.joined = publicKeys.length;
      for (let i = 0; i < publicKeys.length; i++) {
        const key = publicKeys[i];
        if (
          !this.bitcoinUtils.verifyMessage(
            sha256(key.key),
            key.address,
            key.verify
          )
        ) {
          throw new Error(`Public key does not validate: ${key.address}`);
        }
        if (this.roundParams.inputAddresses[key.address]) {
          throw new Error(`Duplicate address: ${key.address}`);
        }
        this.roundParams.inputAddresses[key.address] = true;
        if (key.address === fromAddress) {
          index = i + 1;
        }
      }
      if (index < 0) {
        throw new Error(`Missing my public key`);
      }
      const returnOnions = [];
      const uniqueOnions = {};
      for (const layer of onions) {
        if (uniqueOnions[layer]) {
          throw new Error('Duplicate onions');
        }
        uniqueOnions[layer] = true;

        const decrypted = Shuffle.decrypt(privateKey, layer);
        returnOnions.push(decrypted);
      }
      let encrypted = this.bitcoinUtils.addressToHex(toAddress);
      for (let i = publicKeys.length - 1; i >= index; i--) {
        encrypted = Shuffle.encrypt(publicKeys[i].key, encrypted);
      }
      returnOnions.push(encrypted);
      for (const onion of returnOnions) {
        if (onion.length !== returnOnions[0].length) {
          console.log(
            `ERROR: Invalid length: ${onion.length}, ${returnOnions[0].length}`
          );
          throw new Error(`Invalid onion lengths`);
        }
      }
      Shuffle.shuffle(returnOnions);
      return { onions: returnOnions };
    } catch (err) {
      console.log('ERROR', err);
      const error = { error: err.message };
      this.setRoundError(error);
      return error;
    }
  }

  sign({ alices, secubits, utxos }) {
    try {
      const {
        blameGame,
        fees,
        denomination,
        inputAddresses,
        keys: { fromAddress, changeAddress, toAddress, fromPrivate },
      } = this.roundParams;
      if (blameGame) {
        throw new Error(`Will not sign. Already entered Blame Game`);
      }
      this.setState(CLIENT_STATES.signing);

      // Verify all input addresses
      if (Object.keys(inputAddresses).length !== alices.length) {
        throw new Error(`Invalid number of inputs`);
      }
      for (const alice of alices) {
        if (!inputAddresses[alice.fromAddress]) {
          throw new Error(`Missing input address: ${alice.fromAddress}`);
        }
      }
      this.bitcoinUtils.verifyTransaction({
        alices,
        secubits,
        fromAddress,
        changeAddress,
        toAddress,
      });
      const {
        tx,
        // serialized,
        totalChange,
        totalFees,
        index,
      } = this.bitcoinUtils.createTransaction({
        alices,
        secubits,
        utxos,
        fees,
        denomination,
        key: fromPrivate,
        fromAddress,
        toAddress,
        min_pool: this.min_pool,
      });
      this.roundParams.totalChange = totalChange;
      this.roundParams.totalFees = totalFees;
      this.roundParams.secubits = secubits.length;
      this.roundParams.index = index;
      return { tx };
    } catch (err) {
      console.log('ERROR', err);
      // TODO: Tell server something is wrong
      const error = { error: err.message };
      this.setRoundError(error);
      return error;
    }
  }
  blame() {
    if (
      this.roundParams.blameGame ||
      !this.roundParams ||
      this.roundState === CLIENT_STATES.unjoined
    ) {
      return { error: 'Invalid state for blame game' };
    } else {
      this.roundParams.blameGame = true;
      const {
        keys: { toAddress },
        privateKey,
      } = this.roundParams;
      // TODO: Increment secubitIndex if round entered blame game and sent private key
      // this.secubitIndex++;
      // this.updateKeyIndexes({ changeIndex: this.changeIndex });
      return { privateKey, toAddress };
    }
  }
  wait(delay) {
    return new Promise(resolve => setTimeout(() => resolve(), delay));
  }
}

// module.exports = Client;
export default Client;
// exports.default = Client;
