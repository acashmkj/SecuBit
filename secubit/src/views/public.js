import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsClient from '../actions/client';
import ComponentAddress from '../components/address';
import { formatSat } from '../helpers';
import ComponentConnected from '../components/connected';
import { View, Text, Button } from 'react-native';
import { colors } from '../styles';
import { TESTNET_FAUCET_URL } from '../config';
import store from '../store';

class PublicView extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(message) {
    this.setState({ flash: message });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(() => this.setState({ flash: null }), 8000);
  }

  render() {
    const { flash } = this.state;
    const {
      roundAmount,
      roundInfo,
      addressBalances,
      computedRoundsLeft,
      roundError,
      coinRate,
      settings: { chain, publicIndex, successfulRounds },
    } = store;

    const balance = addressBalances.get(roundInfo.fromAddress);

    return (
      <View style={{ flex: 1 }}>
        <Text
          style={{
            marginTop: 8,
            fontSize: 22,
            fontWeight: 'bold',
            alignSelf: 'center',
          }}
        >
          {formatSat(balance, coinRate).usd}
        </Text>
        {!!coinRate && (
          <Text
            style={{
              marginTop: 4,
              alignSelf: 'center',
              color: colors.lightgray,
            }}
          >
            {formatSat(balance, coinRate).bits}
          </Text>
        )}

        <Text
          style={{
            alignSelf: 'center',
            fontWeight: 'bold',
            color: colors.green,
          }}
        >
          {flash}{' '}
        </Text>

        <View style={{ flex: 1 }} />

        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ComponentAddress
            simpleMode={true}
            onPressUp={() => {
              setTimeout(() => {
                ActionsClient.updateKeyIndexes({
                  publicIndex: parseInt(publicIndex, 10) + 1,
                });
              }, 10);
            }}
            onPressDown={() => {
              setTimeout(() => {
                ActionsClient.updateKeyIndexes({
                  publicIndex: parseInt(publicIndex, 10) - 1,
                });
              }, 10);
            }}
            onValueChange={text => {
              ActionsClient.updateKeyIndexes({ publicIndex: text });
            }}
            value={publicIndex}
            address={roundInfo.fromAddress}
            privateKey={roundInfo.fromPrivateWIF}
            derivePath={roundInfo.fromDerive}
            balance={balance}
            ticker={chain}
            wholeNumbers={false}
            flashMessage={message => this.flash(message)}
            disableIncrementor={false}
          />
          {roundAmount &&
            roundAmount > balance && (
              <View style={{ marginTop: 14, alignItems: 'center' }}>
                {!!TESTNET_FAUCET_URL[chain] && (
                  <Button
                    color={colors.green}
                    title="Get Testnet Bitcoins Here"
                    onPress={() => {
                      window.open(TESTNET_FAUCET_URL[chain], '_blank');
                      // Linking.openURL(TESTNET_FAUCET_URL[chain]);
                    }}
                  />
                )}
                <Text style={{ color: colors.gray, marginTop: 10 }}>
                  Need at least {formatSat(roundAmount, coinRate).usd} to join a
                  round
                </Text>
              </View>
            )}
        </View>

        <View
          style={{ flex: 4, justifyContent: 'center', alignSelf: 'center' }}
        >
          <View>
            {successfulRounds > 0 && (
              <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                <Text style={{ textAlign: 'right', fontSize: 24 }}>
                  {successfulRounds}
                </Text>
                <Text> Rounds Succeeded</Text>
              </View>
            )}
            {/* <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Text style={{ textAlign: 'right', fontSize: 24 }}>
                {failedRounds}
              </Text>
              <Text style={{}}> Failed</Text>
            </View> */}
            {computedRoundsLeft.get() > 0 && (
              <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                <Text style={{ textAlign: 'right', fontSize: 24 }}>
                  {computedRoundsLeft.get()}
                </Text>
                <Text style={{}}> Rounds Remaining</Text>
              </View>
            )}
          </View>
        </View>
        <Text
          style={{
            alignSelf: 'center',
            color: colors.red,
            fontWeight: 'bold',
            marginBottom: 4,
          }}
        >
          {roundError}{' '}
        </Text>
        <ComponentConnected />
      </View>
    );
  }
}

export default observer(PublicView);
