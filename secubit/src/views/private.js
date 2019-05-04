import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View, Text, Button } from 'react-native';
import { colors } from '../styles';
import { formatSat } from '../helpers';
import ActionsClient from '../actions/client';
import TextInput from '../components/textinput';
import ComponentNumPad from '../components/numberpad';
import ComponentUtxo from '../components/utxos';
import QrReader from 'react-qr-reader';
import store from '../store';

class PrivateView extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
      address: '',
      amount: 0,
      showUsd: false,
      showUtxos: false,
      showQrScanner: false,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(flash) {
    this.setState({ flash });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(() => this.setState({ flash: null }), 4000);
  }
  render() {
    const {
      flash,
      amount,
      showUsd,
      address,
      showUtxos,
      sending,
      showQrScanner,
    } = this.state;
    const {
      computedAllUtxos,
      computedMaxSend,
      computedPrivateBalance,
      coinRate,
      settings: { feesPerByte },
    } = store;

    return (
      <View style={{ flex: 1 }}>
        {computedAllUtxos.get().length > 0 && (
          <View
            style={{ marginTop: 8, alignSelf: 'center', alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                alignSelf: 'center',
              }}
            >
              ~ {formatSat(computedPrivateBalance.get(), coinRate).usd}
            </Text>
            {!!coinRate && (
              <Text
                style={{
                  alignSelf: 'center',
                  color: colors.lightgray,
                }}
              >
                ~ {formatSat(computedPrivateBalance.get(), coinRate).bits}
              </Text>
            )}
            <View style={{ marginTop: 6, flexDirection: 'row' }}>
              <Button
                color={showUtxos ? colors.lightergray : colors.lightgray}
                title="  Send  "
                onPress={() =>
                  this.setState({ showUtxos: false, showQrScanner: false })
                }
              />
              <Button
                color={showUtxos ? colors.lightgray : colors.lightergray}
                title="UTXOS"
                onPress={() =>
                  this.setState({ showUtxos: true, showQrScanner: false })
                }
              />
            </View>
          </View>
        )}

        {!showQrScanner &&
          showUtxos &&
          computedAllUtxos.get().length > 0 && <ComponentUtxo />}

        {!showUtxos &&
          showQrScanner && (
            <View style={{ flex: 1 }}>
              <QrReader
                delay={300}
                onError={err => {
                  console.log('QR code error', err);
                  alert(err.message);
                  this.setState({ showQrScanner: false });
                }}
                onScan={address => {
                  if (!ActionsClient.isInvalid(address)) {
                    this.setState({ address, showQrScanner: false });
                  }
                }}
                // style={{ width: '100vw', height: '100vw' }}
              />
              <Button
                color={colors.red}
                title="Cancel"
                onPress={() => this.setState({ showQrScanner: false })}
              />
            </View>
          )}

        {!showQrScanner &&
          ((showUtxos && computedAllUtxos.get().length === 0) ||
            (!showUtxos && computedPrivateBalance.get() === 0)) && (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}
              >
                Spending Wallet is Empty.
              </Text>
              <Text style={{ color: colors.gray }}>
                Send bitcoin to your receiving address to get started.
              </Text>
            </View>
          )}

        {!showQrScanner &&
          !showUtxos &&
          computedPrivateBalance.get() > 0 && (
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  alignSelf: 'center',
                  fontWeight: 'bold',
                  margin: 6,
                  color: (flash && flash.color) || colors.green,
                }}
              >
                {flash ? flash.msg : ' '}
              </Text>

              <View style={{ flex: 1 }} />

              <ComponentNumPad
                onChange={(amount, showUsd) => {
                  this.setState({ amount, showUsd });
                }}
                value={amount}
                flash={msg => this.flash({ msg })}
                max={computedMaxSend.get()}
                rate={coinRate}
              />

              <View style={{ flex: 1 }} />

              <View style={{ margin: 10 }}>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Enter address you want to send to"
                    value={address}
                    textStyle={{}}
                    onChangeText={address => this.setState({ address })}
                  />
                  <Button
                    title="SCAN"
                    onPress={() => {
                      this.setState({ showQrScanner: true });
                    }}
                  />
                </View>
                {/* <View style={{ height: 4 }} /> */}

                <Button
                  title="Send"
                  color={colors.red}
                  disabled={
                    sending || !amount || ActionsClient.isInvalid(address)
                  }
                  onPress={() => {
                    const sendAmount = parseInt(amount, 10);
                    const fees = ActionsClient.calculateFee(feesPerByte);
                    const total = sendAmount + fees;

                    const amountString = showUsd
                      ? formatSat(sendAmount, coinRate).usd
                      : formatSat(sendAmount, coinRate).bits;
                    const minerString = showUsd
                      ? formatSat(fees, coinRate).usd
                      : formatSat(fees, coinRate).bits;
                    const totalString = showUsd
                      ? formatSat(total, coinRate).usd
                      : formatSat(total, coinRate).bits;

                    setTimeout(() => {
                      const dustLimit = ActionsClient.dustLimit();
                      if (sendAmount < dustLimit) {
                        return alert(
                          `Must send at least ${
                            formatSat(dustLimit + 99, coinRate).bits
                          }`
                        );
                      }

                      if (
                        window.confirm(`
Do you want to send ${amountString} to
${address}

Miner Fee: ${minerString}
         Total: ${totalString}
`)
                      ) {
                        this.setState({ sending: true }, async () => {
                          try {
                            const result = await ActionsClient.sendTransaction({
                              amount: sendAmount,
                              toAddress: address,
                              fees: feesPerByte,
                            });
                            if (result) {
                              clearTimeout(this.tsend);
                              this.tsend = setTimeout(() => {
                                this.setState({
                                  amount: 0,
                                  address: '',
                                  sending: false,
                                });
                              }, 500);
                              this.flash({ msg: 'Transaction sent!' });
                            } else {
                              this.flash({
                                msg: 'Transaction failed. Try again',
                                color: colors.red,
                              });
                              this.setState({ sending: false });
                            }
                          } catch (err) {
                            alert(err.message);
                            this.setState({ sending: false });
                          }
                        });
                      }
                    }, 100);
                  }}
                />
              </View>
            </View>
          )}
      </View>
    );
  }
}

export default observer(PrivateView);
