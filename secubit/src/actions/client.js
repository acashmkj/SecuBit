import store from '../store';
import { observe, action } from 'mobx';
import { VERSION, SERVER } from '../config';
import { minifyRound, maxifyRound } from '../helpers';

import Client from '../shufflelink/network';
import Bitcoin from '../shufflelink/bitcoin_bcoin';
const bitcoinUtils = {
  tBTC: new Bitcoin({
    CHAIN: 'tBTC',
    bcoin: window.bcoin,
  }),
  tBCH: new Bitcoin({
    CHAIN: 'tBCH',
    bcoin: window.bcash,
  }),
  BTC: new Bitcoin({
    CHAIN: 'BTC',
    bcoin: window.bcoin,
  }),
  BCH: new Bitcoin({
    CHAIN: 'BCH',
    bcoin: window.bcash,
  }),
};

class ActionsClient {
  constructor() {
    observe(store, 'loaded', () => this.initAlice({}));
    setInterval(() => this.getRoundInfo(), 1000);
  }
  start(chain, seed) {
    store.settings.chain = chain;
    seed = seed || this.newMnemonic(); // Share seed between public/private wallets
    if (!this.isValidSeed(seed)) {
      throw new Error('Invalid seed');
    }
    store.settings.serverAddress = SERVER[chain];
    store.settings.publicSeed = seed;
    store.settings.privateSeed = seed;
    store.settings.routeTab = 'Public';
    store.settings.created = new Date().getTime();
    store.save();
    this.initAlice({});

    store.route = 'Home';
  }
  async clearAlice() {
    await this.disconnect();
    store.secubitClient = null;
    store.clear();
  }
  processBalance(data = {}) {
    const { address, balance, needed, fees, rate, chain, error } = data;
    if (address) {
      store.addressBalances.set(address, balance);
      store.saveBalances();
    }
    if (needed) {
      store.roundAmount = needed;
    }
    if (fees) {
      store.settings.feesPerByte = fees;
      store.save();
    }
    if (rate && chain === store.settings.chain) {
      store.coinRate = rate;
    }
    if (chain === store.settings.chain && error) {
      store.roundError = error;
    }
  }
  initAlice({
    chain = store.settings.chain,
    publicSeed = store.settings.publicSeed,
    privateSeed = store.settings.privateSeed,
    publicIndex = store.settings.publicIndex,
    privateIndex = store.settings.privateIndex,
    serverAddress = store.settings.serverAddress,
  }) {
    if (!publicSeed || !privateSeed) return;
    console.log('Creating new SecuBit Wallet client!');

    store.secubitClient = new Client({
      chain,
      version: VERSION,
      bitcoinUtils: bitcoinUtils[chain],
      aliceSeed: publicSeed,
      secubitSeed: privateSeed,
      aliceIndex: publicIndex,
      secubitIndex: privateIndex,
      changeIndex: publicIndex, // Send change back to the same public wallet address
      serverAddress,
      callbackBalance: res => {
        console.log('callbackBalance', res);
        this.processBalance(res);
      },
      callbackStateChange: state => {
        console.log('callbackStateChange', state);
        store.roundError = null;
        this.getRoundInfo();
      },
      callbackError: err => {
        console.log('callbackError', err);
        this.processBalance(err);
        store.roundError = err ? err.error : null;
        this.getRoundInfo();
      },
      callbackRoundComplete: action(tx => {
        store.roundError = null;
        console.log('callbackRoundComplete', tx);
        const {
          secubitClient,
          settings: { successfulRounds, failedRounds, totalFees },
        } = store;
        store.settings.publicIndex = secubitClient.aliceIndex;
        store.settings.privateIndex = secubitClient.secubitIndex;
        if (!tx.error) {
          store.settings.successfulRounds = successfulRounds + 1;
          store.settings.totalFees = totalFees + (isNaN(tx.fees) ? 0 : tx.fees);
          // store.lastRawTx = {
          //   tx: serialized,
          //   txid,
          // };
          const {
            error,
            // blame,
            to,
            from,
            // change,
            out,
            secubits,
            index,
            txid,
            secubitIndex,
            date,
          } = tx;
          store.completedRounds.unshift(
            minifyRound({
              error: error ? error : undefined,
              address: to,
              amount: out,
              privateIndex: secubitIndex,
              from,
              secubits,
              txid,
              index,
              date,
            })
          );
          store.saveRounds();
        } else {
          console.log('TX Error', tx.error);
          store.roundError = tx.error;
          store.settings.failedRounds = failedRounds + 1;
        }
        store.save();
        this.getRoundInfo();
      }),
    });
    // store.settings.publicSeed = store.secubitClient.aliceSeed;
    // store.settings.privateSeed = store.secubitClient.secubitSeed;
    store.settings.publicIndex = store.secubitClient.aliceIndex;
    store.settings.privateIndex = store.secubitClient.secubitIndex;
    store.settings.chain = chain;
    store.save();
    this.getRoundInfo();
    store.route = 'Home';
    this.connect();
  }
  async updateServer(address) {
    // store.settings.serverAddress = address.replace(/(http:\/\/.*)\//i, '$1');
    store.settings.serverAddress = address;
    store.save();
    if (store.secubitClient) {
      await store.secubitClient.setServer(address);
    }
    await this.connect();
  }
  isValidSeed(seed) {
    return this.bitcoinUtils().isMnemonicValid(seed);
  }
  isValidXPub(key) {
    return this.bitcoinUtils().isXPubValid(key);
  }
  isInvalid(address) {
    return this.bitcoinUtils().isInvalid(address);
  }
  newMnemonic() {
    return this.bitcoinUtils().newMnemonic();
  }
  calculateFeeSat(params) {
    return this.bitcoinUtils().calculateFeeSat(params);
  }
  calculateFee(fees) {
    return this.calculateFeeSat({
      users: 1,
      inputs: 1,
      outputs: 1,
      fees,
    });
  }
  bitcoinUtils() {
    return bitcoinUtils[store.settings.chain];
  }
  updateKeyIndexes({
    publicIndex = store.settings.publicIndex,
    privateIndex = store.settings.privateIndex,
  }) {
    const { secubitClient } = store;
    if (!secubitClient) return;
    secubitClient.updateKeyIndexes({
      aliceIndex: publicIndex,
      secubitIndex: privateIndex,
      changeIndex: publicIndex, // Send change back to the same public wallet address
    });
    store.settings.privateIndex = secubitClient.secubitIndex;
    store.settings.publicIndex = secubitClient.aliceIndex;
    store.save();
    this.getRoundInfo();
  }
  async disconnect() {
    if (store.secubitClient) {
      await store.secubitClient.disconnect();
    }
  }
  async connect() {
    if (store.secubitClient) {
      await store.secubitClient.connect();
    }
  }
  getRoundInfo() {
    store.roundInfo = store.secubitClient ? store.secubitClient.getRoundInfo() : {};
  }
  async sendTransaction({ amount, toAddress, fees, broadcast = true }) {
    const total = amount + this.calculateFee(fees);
    const {
      coinRate,
      roundInfo,
      secubitClient,
      completedRounds,
      computedAvailableUtxos,
      settings: { privateSeed, publicSeed, chain, changeIndex },
    } = store;
    if (!roundInfo || !secubitClient) {
      throw new Error('Something went wrong');
    }
    // secubitClient.disconnect();
    let roundOrig;
    try {
      let round;
      for (const rnd of computedAvailableUtxos.get()) {
        round = maxifyRound(rnd);
        if (!round.error && !round.spent && round.amount >= total) {
          roundOrig = rnd;
          break;
        }
      }
      if (!roundOrig) {
        throw new Error('Could not find an available utxo');
      }

      const fromAddress = round.address;
      const utxo = this.createUtxo(round);
      console.log('Spending utxo', utxo, round);

      // Get spending key
      let key;
      if (round.sentAddress) {
        const { key: changeKey } = bitcoinUtils[chain].generatePrivateChange({
          seed: privateSeed,
          index: changeIndex,
        });
        key = changeKey;
      } else {
        const { toPrivate } = bitcoinUtils[chain].generateAddresses({
          aliceSeed: publicSeed,
          secubitSeed: privateSeed,
          secubitIndex: round.privateIndex,
        });
        key = toPrivate;
      }
      const toChangeIndex = changeIndex + 1;
      const { address: changeAddress } = bitcoinUtils[
        chain
      ].generatePrivateChange({ seed: privateSeed, index: toChangeIndex });

      const txObj = {
        max_fees: secubitClient.max_fees,
        alices: [
          {
            fromAddress,
            changeAddress,
          },
        ],
        secubits: [
          {
            toAddress,
          },
        ],
        utxos: [utxo],
        fees,
        denomination: amount,
        key,
        fromAddress,
        toAddress,
        changeAddress,
        min_pool: 1,
      };
      console.log('TX', txObj);

      const {
        tx,
        serialized,
        changeIndex: index,
        totalChange,
      } = await bitcoinUtils[chain].createTransaction(txObj);
      console.log('CREATED TX');
      let txid = tx.hash;
      // let broadcasted = false;
      if (broadcast) {
        let res;
        try {
          res = await secubitClient.broadcastTx(serialized);
          console.log('Boadcast tx response', res);

          if (res.error) {
            const err = new Error(res.error);
            err.addresses = res.addresses;
            throw err;
          }
          if (!txid) {
            throw new Error('Missing txid');
          }
          txid = res.result;
          // broadcasted = true;
        } catch (err) {
          console.log('ERROR broadcasting tx', err);
          if (err.message === 'Failed to fetch') {
            throw new Error('Could not broadcast trasanction');
          }
          throw err;
        }
      }

      let newUtxo;
      if (totalChange > 0) {
        newUtxo = minifyRound({
          address: changeAddress,
          amount: totalChange,
          index,
          privateIndex: changeIndex,
          sentAddress: toAddress,
          sentAmount: amount,
          fromTxid: round.txid,
          txid,
          date: new Date().getTime(),
        });
        store.settings.changeIndex = toChangeIndex;
        store.save();
      } else {
        console.log('No change utxo');
        newUtxo = minifyRound({
          sentAddress: toAddress,
          sentAmount: amount,
          fromTxid: round.txid,
          txid,
          date: new Date().getTime(),
        });
      }
      if (coinRate) {
        newUtxo.r = coinRate;
      }

      console.log('New utxo', newUtxo);
      completedRounds.unshift(newUtxo);
      roundOrig.u = true;
      store.saveRounds();
      return serialized;
    } catch (err) {
      // secubitClient.connect();
      if (roundOrig && err.addresses && err.addresses.length > 0) {
        const result = window.confirm(`
Transaction Failed

Invalid utxo address: ${roundOrig.a}

Do you want to mark it as spent?
`);
        if (result) {
          // Mark as spent
          roundOrig.u = true;
          store.saveRounds();
        }
      } else {
        throw err;
      }
    }
    // secubitClient.connect();
  }
  dustLimit() {
    return bitcoinUtils[store.settings.chain].DUST_LIMIT;
  }

  createUtxo(round) {
    return {
      version: 1,
      height: -1,
      value: round.amount,
      script: bitcoinUtils[store.settings.chain].getScriptForAddress(
        round.address
      ),
      address: round.address,
      coinbase: false,
      hash: round.txid,
      index: round.index,
    };
  }
}

export default new ActionsClient();
