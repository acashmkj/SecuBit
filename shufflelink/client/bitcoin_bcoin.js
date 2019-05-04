const bitcoinMessage = require('bitcoinjs-message');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const cashaddr = require('cashaddrjs');

const MAPPER = {
  tBTC: 'testnet',
  tBCH: 'testnet',
  BTC: 'main',
  BCH: 'main',
};

class Bitcoin {
  constructor({ CHAIN = 'tBTC', URI, APIKEY, bcoin, DUST_LIMIT = 546 }) {
    this.bcoin = bcoin;
    this.NETWORK = MAPPER[CHAIN];
    try {
      this.enforceNetwork();
    } catch (err) {
      console.log('Invalid chain', CHAIN, this.NETWORK);
      throw err;
    }
    this.CHAIN = CHAIN;
    this.URI = URI;
    this.APIKEY = APIKEY;

    this.DUST_LIMIT = DUST_LIMIT;

    if (this.NETWORK === 'main') {
      this.BITCOINJS_NETWORK = bitcoin.networks.bitcoin;
    } else {
      this.BITCOINJS_NETWORK = bitcoin.networks.testnet;
    }
  }

  enforceNetwork() {
    this.bcoin.set(this.NETWORK);
  }

  newMnemonic(seed) {
    this.enforceNetwork();
    const mn = new this.bcoin.hd.Mnemonic({ phrase: seed });
    return mn.toString();
  }
  isMnemonicValid(seed) {
    if (!seed) return false;
    try {
      this.newMnemonic(seed);
      return true;
    } catch (err) {
      return false;
    }
  }
  isXPubValid(pubKey) {
    this.enforceNetwork();
    if (!pubKey) return false;
    try {
      const key = this.bcoin.hd.from(pubKey);
      return !!key;
    } catch (err) {
      return false;
    }
  }
  normalizeAddress(address) {
    this.enforceNetwork();
    try {
      const decoded = cashaddr.decode(address);
      address = this.bcoin.primitives.Address.fromHash(
        Buffer.from(decoded.hash)
      ).toBase58();
    } catch (err) {
      // Ignore
    }
    return address;
  }
  isInvalid(address) {
    this.enforceNetwork();
    // address = this.normalizeAddress(address);
    try {
      // address = address.toString();
      const addr = this.bcoin.primitives.Address.fromString(address);
      if (address !== addr.toString()) {
        throw new Error('Invalid');
      }
      return false;
    } catch (err) {
      return true;
    }
  }
  addressToHex(address) {
    this.enforceNetwork();
    // address = this.normalizeAddress(address);
    return this.bcoin.primitives.Address.fromString(address)
      .toRaw()
      .toString('hex');
  }
  hexToAddress(hex) {
    this.enforceNetwork();
    const raw = Buffer.from(hex, 'hex');
    return this.bcoin.primitives.Address.fromRaw(raw).toString();
  }

  getChainCode() {
    let coinChain = 1; // Testnet default
    if (this.CHAIN === 'BTC') {
      coinChain = 0;
    } else if (this.CHAIN === 'BCH') {
      coinChain = 145;
    } else if (this.CHAIN === 'tBTC') {
      coinChain = 1;
    } else if (this.CHAIN === 'tBCH') {
      coinChain = 145; // TODO: Testnet?
    }
    return coinChain;
  }

  generatePrivateChange({ seed, index }) {
    this.enforceNetwork();
    if (typeof index !== 'number' || isNaN(index) || index < 0) {
      throw new Error('Invalid indexe');
    }
    if (!seed || !this.isMnemonicValid(seed)) {
      throw new Error('Invalid seed');
    }
    const mnemonic = new this.bcoin.hd.Mnemonic({ phrase: seed });
    const master = this.bcoin.hd.from(mnemonic);
    const coinChain = this.getChainCode();
    const derive = `m/44'/${coinChain}'/0'/2/${index}`;
    const derived = master.derivePath(derive);
    const keyring = this.bcoin.primitives.KeyRing.fromKey(derived.privateKey);
    const address = keyring.getKeyAddress('string');
    // privateWIF = keyring.getPrivateKey('base58');
    return {
      address,
      key: keyring,
    };
  }

  generateAddresses({
    aliceSeed,
    secubitSeed,
    secubitIndex = 0,
    aliceIndex = 0,
    changeIndex,
  }) {
    this.enforceNetwork();
    secubitIndex = parseInt(secubitIndex, 10);
    aliceIndex = parseInt(aliceIndex, 10);
    changeIndex =
      changeIndex === undefined ? aliceIndex + 1 : parseInt(changeIndex, 10);
    if (
      typeof secubitIndex !== 'number' ||
      typeof aliceIndex !== 'number' ||
      typeof changeIndex !== 'number' ||
      isNaN(secubitIndex) ||
      isNaN(aliceIndex) ||
      isNaN(changeIndex) ||
      secubitIndex < 0 ||
      aliceIndex < 0 ||
      changeIndex < 0
    ) {
      throw new Error('Invalid indexes');
    }
    if (!aliceSeed || !secubitSeed) {
      throw new Error('Invalid seeds');
    }
    const alice = new this.bcoin.hd.Mnemonic({ phrase: aliceSeed });
    const masterAlice = this.bcoin.hd.from(alice);

    const coinChain = this.getChainCode();

    let toAddress;
    let toDerive;
    let toPrivateWIF;
    let toKeyring;
    if (this.isMnemonicValid(secubitSeed)) {
      const secubit = new this.bcoin.hd.Mnemonic({ phrase: secubitSeed });
      const masterSecuBit = this.bcoin.hd.from(secubit);
      toDerive = `m/44'/${coinChain}'/0'/${
        aliceSeed === secubitSeed ? 1 : 0
      }/${secubitIndex}`;
      const toKey = masterSecuBit.derivePath(toDerive);
      // const toKeyring = this.bcoin.keyring(toKey.privateKey);
      toKeyring = this.bcoin.primitives.KeyRing.fromKey(toKey.privateKey);
      toAddress = toKeyring.getKeyAddress('string');
      toPrivateWIF = toKeyring.getPrivateKey('base58');
    } else if (this.isXPubValid(secubitSeed)) {
      const secubit = this.bcoin.hd.from(secubitSeed);
      toDerive = `m/0/${secubitIndex}`;
      const toKey = secubit.derivePath(toDerive);
      toKeyring = this.bcoin.primitives.KeyRing.fromKey(toKey.publicKey);
      toAddress = toKeyring.getKeyAddress('string');
    } else if (!this.isInvalid(secubitSeed)) {
      toAddress = secubitSeed;
    } else {
      throw new Error('Invalid secubit seed');
    }

    const fromDerive = `m/44'/${coinChain}'/0'/0/${aliceIndex}`;
    const changeDerive = `m/44'/${coinChain}'/0'/0/${changeIndex}`;
    const fromKey = masterAlice.derivePath(fromDerive); // TODO: Change depending on network
    const changeKey = masterAlice.derivePath(changeDerive); // TODO: Change depending on network
    const fromKeyring = this.bcoin.primitives.KeyRing.fromKey(
      fromKey.privateKey
    );
    const changeKeyring = this.bcoin.primitives.KeyRing.fromKey(
      changeKey.privateKey
    );
    const fromPrivateWIF = fromKeyring.getPrivateKey('base58');
    const changePrivateWIF = changeKeyring.getPrivateKey('base58');

    return {
      fromPrivate: fromKeyring,
      fromPrivateWIF,
      // toPrivate: toKeyring,
      // changePrivate: changeKeyring,
      fromAddress: fromKeyring.getKeyAddress('string'),
      // toAddress: toKeyring.getAddress('base58'),
      toAddress,
      toPrivateWIF,
      toPrivate: toKeyring,
      changePrivateWIF,
      changeAddress: changeKeyring.getKeyAddress('string'),
      fromDerive,
      toDerive,
      changeDerive,
      changeIndex,
      secubitIndex,
      aliceIndex,
    };
  }

  verifyMessage(message, address, signature) {
    address = this.normalizeAddress(address);
    return bitcoinMessage.verify(message, address, signature);
  }
  signMessage(message, key) {
    const keyWIF = key.getPrivateKey('base58');
    const keyPair = bitcoin.ECPair.fromWIF(keyWIF, this.BITCOINJS_NETWORK);
    const privateKey = keyPair.d.toBuffer(32);
    const signature = bitcoinMessage.sign(
      message,
      privateKey,
      keyPair.compressed
    );
    return signature.toString('base64');
  }
  getScriptForAddress(address) {
    this.enforceNetwork();
    return new this.bcoin.script.Script().fromAddress(address).toJSON();
  }
  getFakeUtxos({ address, txid, vout, satoshis }) {
    // address = this.normalizeAddress(address);
    const utxos = [
      {
        address,
        txid,
        vout,
        satoshis,

        index: vout,
        value: satoshis,
        coinbase: false,
        version: 1,
        hash: txid,
        script: this.getScriptForAddress(address),
        height: 1260734,
      },
    ];
    return utxos;
  }
  getUtxosBalance(utxos, address = null) {
    // address = this.normalizeAddress(address);
    let balance = 0;
    utxos.map(utxo => {
      if (typeof utxo.value !== 'undefined' && utxo.value > 0) {
        if (utxo.address === address) {
          balance += utxo.value;
        }
      } else {
        throw new Error('Invalid utxo');
      }
      return true;
    });
    return balance;
  }
  compareUtxoSets(utxos1, utxos2) {
    const mapUtxos1 = {};
    utxos1.map(utxo => (mapUtxos1[utxo.address] = {}));
    utxos1.map(utxo => (mapUtxos1[utxo.address][utxo.txid] = true));
    const mapUtxos2 = {};
    utxos2.map(utxo => (mapUtxos2[utxo.address] = {}));
    utxos2.map(utxo => (mapUtxos2[utxo.address][utxo.txid] = true));
    utxos2.map(utxo => {
      if (mapUtxos1[utxo.address] && mapUtxos1[utxo.address][utxo.txid]) {
        delete mapUtxos1[utxo.address][utxo.txid];
        if (Object.keys(mapUtxos1[utxo.address]).length === 0) {
          delete mapUtxos1[utxo.address];
        }
      }
      if (mapUtxos2[utxo.address] && mapUtxos2[utxo.address][utxo.txid]) {
        delete mapUtxos2[utxo.address][utxo.txid];
        if (Object.keys(mapUtxos2[utxo.address]).length === 0) {
          delete mapUtxos2[utxo.address];
        }
      }
      return true;
    });
    const combined = Object.assign({}, mapUtxos1, mapUtxos2);
    const addresses = Object.keys(combined);
    if (addresses.length > 0) {
      const err = new Error('Utxo change');
      err.data = addresses;
      throw err;
    }
    return true;
  }

  validateUtxo(utxos) {
    for (const utxo of utxos) {
      if (utxo.coinbase) {
        throw new Error('Invalid utxo. No Coinbase coins allowed.');
      }
    }
    return true;
  }
  async validateTxUtxosAfterBroadcast({ addresses, utxos }) {
    const afterUtxos = await this.getUtxos(addresses);
    const hashMap = {};
    for (const utxo of utxos) {
      hashMap[`${utxo.hash}.${utxo.index}`] = utxo;
    }
    const badAddresses = {};
    for (const utxo of afterUtxos) {
      const key = `${utxo.hash}.${utxo.index}`;
      if (hashMap[key]) {
        // utxo has not been spent
        badAddresses[utxo.address] = true;
      }
    }
    const badAddressArray = Object.keys(badAddresses);
    if (badAddressArray.length > 0) {
      const error = new Error(`TX broadcast may have failed`);
      error.addresses = badAddressArray;
      error.utxos = afterUtxos;
      throw error;
    }
  }
  async validateTxidAfterBroadcast({ txid }) {
    try {
      await this.getTx(txid);
    } catch (err) {
      throw new Error(`Missing txid: ${txid}`);
    }
  }

  getUtxos(address) {
    return this.getUtxosBcoin(address);
  }

  getUtxosBcoin(addresses) {
    addresses = Array.isArray(addresses) ? addresses : [addresses.toString()];
    addresses = addresses.map(addr => this.normalizeAddress(addr.toString()));
    // console.log('getUtxosBcoin', addresses);
    return new Promise((resolve, reject) => {
      axios({
        url: `/coin/address`,
        method: 'POST',
        baseURL: `http://x:${this.APIKEY}@${this.URI}`,
        data: { addresses },
      })
        .then(res => {
          // console.log('getUtxosBcoin response', res.data);
          this.validateUtxo(res.data);
          let utxosMap = {};
          for (const utxo of res.data) {
            if (!utxo.hash) {
              throw new Error('Missing utxo hash');
            }
            const hash = `${utxo.index}.${utxo.hash}`;
            if (!utxosMap[hash] || utxosMap[hash].height < utxo.height) {
              utxosMap[hash] = utxo;
            } else {
              // console.log('Duplicate utxo', utxo);
            }
          }
          utxosMap = Object.values(utxosMap);
          resolve(utxosMap);
        })
        .catch(reject);
    });
  }
  getInfo() {
    return new Promise((resolve, reject) => {
      axios({
        url: `/`,
        method: 'GET',
        baseURL: `http://x:${this.APIKEY}@${this.URI}`,
      })
        .then(res => {
          resolve(res.data);
        })
        .catch(reject);
    });
  }
  getTx(txid) {
    return new Promise((resolve, reject) => {
      axios({
        url: `/tx/${txid}`,
        method: 'GET',
        baseURL: `http://x:${this.APIKEY}@${this.URI}`,
      })
        .then(res => {
          resolve(res.data);
        })
        .catch(reject);
    });
  }

  async broadcastTx(serialized) {
    return new Promise((resolve, reject) => {
      axios({
        url: `/`,
        method: 'POST',
        baseURL: `http://x:${this.APIKEY}@${this.URI}`,
        data: {
          method: 'sendrawtransaction',
          params: [serialized],
        },
      })
        .then(res => resolve(res.data))
        .catch(reject);
    });
  }

  calculateFeeSat({ users, inputs, outputs, fees }) {
    const baseSize = 10;
    const outputSize = 34;
    const inputSize = 41;
    const sigSize = 107;
    const baseFee = users > 0 ? Math.ceil(baseSize / users) : 0;
    const result =
      fees * (baseFee + outputSize * outputs + (inputSize + sigSize) * inputs);
    if (isNaN(result)) {
      console.log(users, inputs, outputs, fees, result);
      throw new Error('Invalid fee calculation');
    }
    return result;
  }

  createTransaction({
    alices,
    secubits,
    utxos,
    fees,
    denomination,
    key,
    fromAddress,
    toAddress,
    changeAddress,
    min_pool,
    max_fees,
  }) {
    this.enforceNetwork();
    console.log('Constructing TX...');
    // fromAddress = this.normalizeAddress(fromAddress);

    // Sanity check
    if (alices.length !== secubits.length) {
      throw new Error('Invalid number of inputs to outputs');
    }
    if (min_pool && alices.length < min_pool) {
      throw new Error('Not enough alices in the round');
    }
    if (max_fees && fees > max_fees) {
      throw new Error('Fees exceed max fees');
    }
    if (denomination <= this.DUST_LIMIT) {
      throw new Error(`Denomination must be greater than ${this.DUST_LIMIT}`);
    }
    // Validate addresses
    alices.map(alice => {
      if (this.isInvalid(alice.fromAddress)) {
        throw new Error(`Invalid fromAddress: ${alice.fromAddress}`);
      }
      if (this.isInvalid(alice.changeAddress)) {
        throw new Error(`Invalid changeAddress: ${alice.changeAddress}`);
      }
      return true;
    });
    secubits.map(secubit => {
      if (this.isInvalid(secubit.toAddress)) {
        throw new Error(`Invalid toAddress: ${secubit.toAddress}`);
      }
      return true;
    });

    utxos = utxos.map(utxo => {
      return this.bcoin.primitives.Coin.fromJSON(utxo);
    });

    let totalIn = 0;
    let totalOut = 0;
    let totalChange = 0;
    let totalFees = 0;
    let txFees = 0;

    // Assign utxos with from addresses
    const aliceHash = {};
    alices.map(alice => {
      return (aliceHash[alice.fromAddress] = {
        utxos: [],
        fromAddress: alice.fromAddress,
        changeAddress: alice.changeAddress,
      });
    });
    utxos.map(utxo => {
      const utxoObj = utxo.toJSON();
      // utxoObj.address = this.normalizeAddress(utxoObj.address);
      if (this.isInvalid(utxoObj.address)) {
        throw new Error(`Invalid utxo address: ${utxoObj.address}`);
      }
      if (!aliceHash[utxoObj.address]) {
        throw new Error(`utxo does not match fromAddress: ${utxoObj.address}`);
      }
      return aliceHash[utxoObj.address].utxos.push(utxo);
    });
    alices = Object.keys(aliceHash).map(key => aliceHash[key]);

    const tx = new this.bcoin.primitives.MTX({
      // changeAddress: 'mixEyiH9dbRgGXc2cYhRAvXoZtKiBhDbiU', // TODO: CHANGE!
    });
    alices.map(alice => {
      if (alice.utxos.length === 0) {
        throw new Error('Alice missing utxo');
      }
      const totalSatoshis = alice.utxos.reduce(
        (previous, utxo) => previous + parseInt(utxo.value, 10),
        0
      );
      const aliceFees = this.calculateFeeSat({
        users: alices.length,
        inputs: alice.utxos.length,
        outputs: 2,
        fees,
      });
      const change = totalSatoshis - denomination - aliceFees;
      totalIn += totalSatoshis;
      alice.utxos.map(utxo => tx.addCoin(utxo));
      if (change > this.DUST_LIMIT) {
        // Only add a change output when there is a non zero value
        tx.addOutput({ address: alice.changeAddress, value: change });

        if (alice.fromAddress === fromAddress) {
          totalChange = change;
          totalFees = aliceFees;
        }
        totalOut += change;
        txFees += aliceFees;
      } else {
        if (alice.fromAddress === fromAddress) {
          totalFees = aliceFees + change;
        }
        txFees += aliceFees + change;
      }

      return true;
    });
    secubits.map(secubit => {
      totalOut += denomination;
      return tx.addOutput({ address: secubit.toAddress, value: denomination });
    });
    // tx.change('mixEyiH9dbRgGXc2cYhRAvXoZtKiBhDbiU'); // TODO: Add change address!
    // const fee = tx.getFee();
    // console.log('Fee', fee);
    // const fee = fees * utxos.length;
    // tx.fee(fee);

    tx.sortMembers();

    let index = -1;
    if (toAddress) {
      const outputAddresses = tx
        .getOutputAddresses()
        .map(addr => addr.toString());
      index = outputAddresses.indexOf(toAddress);
    }
    let changeIndex = -1;
    if (changeAddress) {
      const outputAddresses = tx
        .getOutputAddresses()
        .map(addr => addr.toString());
      changeIndex = outputAddresses.indexOf(changeAddress);
    }

    // Sanity check
    totalOut += txFees;
    if (totalIn !== totalOut) {
      console.log('Invalid inputs to outputs!', totalIn, totalOut, txFees);
      throw new Error('Invalid inputs to outputs!');
    }
    if (tx.getFee() !== txFees) {
      // console.log('Invalid fee', tx.getFee(), fee + DUST_LIMIT, fee, fees, utxos.length);
      throw new Error('Invalid fee');
    }
    if (tx.getInputValue() !== tx.getOutputValue() + tx.getFee()) {
      throw new Error('Invalid inputs to outputs');
    }

    if (key) {
      const numSigned = tx.sign(key);
      if (numSigned === 0) {
        throw new Error(`Could not sign tx.`);
      }
      console.log('Signed transaction');
    }
    const serialized = tx
      .toTX()
      .toRaw()
      .toString('hex');
    // console.log('signed tx', tx.toJSON())
    return {
      tx: tx.toJSON(),
      size: tx.getSize(),
      // tx: tx.toTX(),
      serialized,
      totalChange,
      totalFees,
      index,
      changeIndex,
    };
  }

  async validateTx(tx) {
    this.enforceNetwork();
    tx = this.bcoin.primitives.TX.fromRaw(tx, 'hex');
    if (!tx.isStandard()) {
      const error = new Error('Tx is not standard');
      error.data = tx;
      throw error;
    }
    if (!tx.isSane()) {
      const error = new Error('Tx is not sane');
      error.data = tx;
      throw error;
    }
    const addresses = tx.getInputAddresses();
    const utxos = await this.getUtxos(addresses);
    // console.log('Validating utxos are in tx', addresses, utxos);
    const utxoInputs = utxos.map(utxo => {
      const coin = this.bcoin.primitives.Coin.fromJSON(utxo);
      const input = this.bcoin.primitives.Input.fromCoin(coin);
      return input;
    });
    const missingAddresses = {};
    for (const input of tx.inputs) {
      let matched = false;
      for (let i = 0; i < utxoInputs.length; i++) {
        if (input.equals(utxoInputs[i])) {
          matched = true;
          utxoInputs.splice(i, 1);
          break;
        }
      }
      if (!matched) {
        const address = input.getAddress().toString();
        missingAddresses[address] = true;
      }
    }
    const addressArray = Object.keys(missingAddresses);
    if (addressArray.length > 0) {
      console.log('validateTx missing utxo', tx.toJSON());
      const error = new Error(
        `Missing utxos for: ${
          addressArray.length === 1
            ? addressArray[0]
            : JSON.stringify(addressArray)
        }`
      );
      error.addresses = addressArray;
      throw error;
    }
    return { addresses, utxos };
  }

  // Server only
  combineTxs({ tx, signedTxs }) {
    this.enforceNetwork();
    // console.log('BEFORE', tx.inputs, signedTxs.map(tx => tx.inputs));
    // tx = this.bcoin.primitives.TX.fromRaw(tx, 'hex');
    // signedTxs = signedTxs.map(tx =>
    //   this.bcoin.primitives.TX.fromRaw(tx, 'hex')
    // );
    // console.log('WOIEFJOIWEJFOIWJEFOWIJF', tx);
    delete tx.hash;
    delete tx.witnessHash;
    signedTxs.map(signedTx => {
      // signedTx = this.bcoin.primitives.TX.fromRaw(signedTx, 'hex').toJSON();
      // console.log('OIWJEFOIJWEFOIWJEF', signedTx, JSON.stringify(signedTx));
      signedTx.inputs.map((input, index) => {
        const finalTx = tx.inputs[index];
        // console.log('SIGNING COMBINING INPUT', input, JSON.stringify(input));
        if (
          input.script &&
          input.prevout.hash === finalTx.prevout.hash &&
          input.prevout.index === finalTx.prevout.index
        ) {
          // Signed
          // console.log('WOIEJF SIGNED TX OIWEJFOIWEJFWIJEF', input, JSON.stringify(input));

          // finalInput.script = input.script;
          // finalTx.script = input.script;
          tx.inputs[index] = input;
        }
        return true;
      });
      return true;
    });
    const finalTx1 = this.bcoin.primitives.TX.fromJSON(tx);
    if (finalTx1.isSane() && finalTx1.isStandard()) {
      const serialized = finalTx1.toRaw().toString('hex');
      return { serialized, txid: finalTx1.txid() };
    } else {
      console.log('Error: combineTxs. Not sane or standard', tx);
      throw new Error('Not fully signed');
    }
  }

  // Client only
  verifyTransaction({ alices, secubits, fromAddress, changeAddress, toAddress }) {
    // fromAddress = this.normalizeAddress(fromAddress);
    // changeAddress = this.normalizeAddress(changeAddress);
    // toAddress = this.normalizeAddress(toAddress);

    // Make sure our addresses are in the pool
    let verifyAlice = false;
    let verifySecuBit = false;
    alices.map(alice => {
      if (
        alice.fromAddress === fromAddress &&
        alice.changeAddress === changeAddress
      ) {
        verifyAlice = true;
      }
      return true;
    });
    secubits.map(secubit => {
      if (secubit.toAddress === toAddress) {
        verifySecuBit = true;
      }
      return true;
    });
    if (!verifySecuBit || !verifyAlice) {
      throw new Error('All your addresses are not in the pool! Aborting');
    }
    return true;
  }
}

// module.exports = Bitcoin;
export default Bitcoin;
// exports.default = Bitcoin;
