import { computed } from 'mobx';
import ActionsClient from '../actions/client';

const ComputedWallet = store => {
  store.computedRoundsLeft = computed(() => {
    const {
      roundAmount,
      addressBalances,
      roundInfo: { fromAddress },
    } = store;
    if (roundAmount && !isNaN(roundAmount) && fromAddress) {
      return Math.floor((addressBalances.get(fromAddress) || 0) / roundAmount);
    }
    return null;
  });

  store.computedMaxSend = computed(() => {
    const {
      completedRounds,
      settings: { feesPerByte },
    } = store;
    const fee = !isNaN(feesPerByte)
      ? ActionsClient.calculateFee(feesPerByte)
      : 0;
    let max = 0;
    for (const round of completedRounds.slice()) {
      if (!round.e && !round.u && !isNaN(round.o) && round.o > max) {
        max = round.o - fee;
      }
    }
    return max < 0 ? 0 : max;
  });

  store.computedNumUtxos = computed(() => {
    const { completedRounds } = store;
    let num = 0;
    for (const round of completedRounds) {
      if (!round.e && !round.u && round.o) {
        num++;
      }
    }
    return num;
  });

  store.computedAvailableUtxos = computed(() => {
    const { completedRounds } = store;
    const utxos = [];
    for (const round of completedRounds.slice()) {
      if (!round.e && !round.u && round.o) {
        utxos.push(round);
      }
    }
    // Sort by output and then random order
    utxos.sort((a, b) => {
      return a.o - b.o || Math.random() - Math.random();
    });
    return utxos;
  });

  store.computedPrivateBalance = computed(() => {
    const { completedRounds } = store;
    let value = 0;
    for (const round of completedRounds.slice()) {
      if (!round.e && !round.u && !isNaN(round.o)) {
        value += round.o;
      }
    }
    return value;
  });

  store.computedAllUtxos = computed(() => {
    const { completedRounds } = store;
    const utxos = [];
    for (const round of completedRounds.slice()) {
      if (!round.e) {
        utxos.push(round);
      }
    }
    utxos.sort((a, b) => b.d - a.d);
    return utxos;
  });
};

export default ComputedWallet;
