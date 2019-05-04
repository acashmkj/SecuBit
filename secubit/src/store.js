import { AsyncStorage } from 'react-native';
import { extendObservable, observable } from 'mobx';
import ComputedWallet from './computed/wallet';

import { DEFAULT_ROUTE, DEFAULT_TAB, VERSION, DEFAULT_CHAIN } from './config';

const DEFAULT_SETTINGS = {
  version: VERSION,
  routeTab: DEFAULT_TAB,

  publicSeed: null,
  privateSeed: null,
  publicIndex: 0,
  privateIndex: 0,
  changeIndex: 0,

  serverAddress: '',
  chain: DEFAULT_CHAIN,

  lastBackup: null,
  successfulRounds: 0,
  failedRounds: 0,
  totalFees: 0,
  feesPerByte: null,

  created: new Date().getTime(),
};

class Store {
  constructor() {
    extendObservable(this, {
      loaded: false, // Is persistent data loaded
      route: DEFAULT_ROUTE,
      secubitClient: null,
      addressBalances: observable.map(),
      roundInfo: {},
      roundError: null,
      neededFunds: null,
      roundAmount: null,
      coinRate: null,

      settings: DEFAULT_SETTINGS,
      completedRounds: observable.array(),
    });

    ComputedWallet(this);

    this.loadState();
  }

  async loadState() {
    try {
      const stateString = await AsyncStorage.getItem('settings');
      if (stateString) {
        const state = JSON.parse(stateString);
        for (const key of Object.keys(state)) {
          this.settings[key] = state[key];
        }
      }
      this.loaded = true;
    } catch (err) {
      console.log('Store load error', err);
      this.loaded = true;
    }

    try {
      const stateString = await AsyncStorage.getItem('rounds');
      if (stateString) {
        const state = JSON.parse(stateString);
        this.completedRounds = observable.array(state);
      }
    } catch (err) {
      console.log('Store error', err);
    }

    try {
      const stateString = await AsyncStorage.getItem('balances');
      if (stateString) {
        const state = JSON.parse(stateString);
        this.addressBalances = observable.map(state);
      }
    } catch (err) {
      console.log('Store balances error', err);
    }
  }

  async save() {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(this.settings));
      console.log('Saved state');
    } catch (error) {
      console.log('Store Error', error);
    }
  }
  async saveRounds() {
    try {
      await AsyncStorage.setItem(
        'rounds',
        JSON.stringify(this.completedRounds)
      );
      console.log('Saved rounds');
    } catch (error) {
      console.log('Store Error', error);
    }
  }
  async saveBalances() {
    try {
      await AsyncStorage.setItem(
        'balances',
        JSON.stringify(this.addressBalances)
      );
      console.log('Saved balances');
    } catch (error) {
      console.log('Store balances Error', error);
    }
  }

  clear() {
    console.log('!!!!!!!!!! CLEARING ALL PERSISTENT DATA !!!!!!!!!');
    this.settings = DEFAULT_SETTINGS;
    this.save();

    this.completedRounds = observable.array();
    this.saveRounds();

    this.addressBalances = observable.map();
    this.saveBalances();

    this.roundInfo = {};
    this.roundError = null;
    this.route = 'Welcome';
  }
}

export default new Store();
