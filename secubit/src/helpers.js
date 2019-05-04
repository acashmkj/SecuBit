import { Dimensions } from 'react-native';
import BigNumber from 'bignumber.js';
import FileSaver from 'file-saver';

export const rateToSat = (amount, rate) => {
  amount = new BigNumber(amount.toString());
  rate = new BigNumber(rate.toString());
  return amount.times(100000000).dividedBy(rate);
};

export const satToRate = (amount, rate) => {
  amount = new BigNumber(amount.toString());
  rate = new BigNumber(rate.toString());
  return amount.dividedBy(100000000).times(rate);
};

export const satToBits = amount => {
  amount = new BigNumber(amount.toString());
  return amount.dividedBy(100);
};

export const formatSat = (amount, rate, dontFallback) => {
  if (typeof amount === 'undefined' || amount === null) {
    return {
      bits: `Unknown Amount`,
      usd: `Unknown Amount`,
    };
  }
  amount = new BigNumber(amount.toString());
  if (rate) {
    rate = new BigNumber(rate.toString());
  }
  // if (wholeNumber) {
  //   return `${num.dividedBy(100000000).toFormat(8)} ${ticker || ''}`;
  // } else {
  //   return `${num.dividedBy(100).toFormat(0)} ${ticker || ''} bits`;
  // }
  // return `${num.dividedBy(100).toFormat(0)} ${ticker || ''} bits`;
  const bits = `${satToBits(amount).toFormat(0)} bits`;
  const usd = rate
    ? `$${satToRate(amount, rate).toFormat(2)}`
    : dontFallback
      ? ''
      : bits;
  return {
    bits,
    usd,
  };
};

export const download = content => {
  var blob = new window.Blob([content], { type: 'text/plain;charset=utf-8' });
  FileSaver.saveAs(blob, 'secubit_backup.txt');
};

export const smallScreen = Dimensions.get('window').width <= 542;

const ROUND_MAP = {
  e: 'error',
  a: 'address',
  o: 'amount', // Amount owned,
  j: 'privateIndex', // privateSeed index for spending
  f: 'fromTxid', // Where
  s: 'sentAddress', // External sent address
  t: 'sentAmount', // External amount sent
  // c: 'change',
  // s: 'fees',
  // l: 'left',
  b: 'secubits',
  x: 'txid',
  i: 'index', // Coin index in tx
  u: 'spent', // Boolean if spent
  // n: 'disabled', // Boolean to mark if tx is disabled
  r: 'rate', // USD rate
  d: 'date',
};

export function maxifyRound(round) {
  if (round.date) return round;
  const newRound = {};
  Object.keys(round).map(key => {
    if (ROUND_MAP[key]) {
      newRound[ROUND_MAP[key]] = round[key];
    }
    return true;
  });
  return newRound;
}
export function minifyRound(round) {
  if (round.d) return round;
  const INVERTED_ROUND_MAP = {};
  Object.keys(ROUND_MAP).map(key => {
    if (ROUND_MAP[key]) {
      INVERTED_ROUND_MAP[ROUND_MAP[key]] = key;
    }
    return true;
  });
  const newRound = {};
  Object.keys(round).map(key => {
    if (INVERTED_ROUND_MAP[key]) {
      newRound[INVERTED_ROUND_MAP[key]] = round[key];
    }
    return true;
  });
  return newRound;
}
