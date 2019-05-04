import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsClient from '../actions/client';
import ActionsSettings from '../actions/settings';
import TextInput from '../components/textinput';
import Github from '../components/github';
import ComponentTextLine from '../components/textline';
import { View, Text, Button, Clipboard } from 'react-native';
import { colors } from '../styles';
import store from '../store';
import { VERSION } from '../config';
import moment from 'moment';

class Settings extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
      showSeed: false,
      deleteWallet: false,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(message) {
    this.setState({ flash: message });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(() => this.setState({ flash: null }), 10000);
  }

  render() {
    const {
      coinRate,
      settings: { serverAddress, publicSeed, lastBackup, chain },
    } = store;
    const { showSeed, deleteWallet, flash } = this.state;
    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ position: 'absolute', top: 2, right: 6 }}>
          v{VERSION}
        </Text>
        <Text style={{ fontWeight: 'bold', margin: 6, color: colors.green }}>
          {flash}{' '}
        </Text>

        <View style={{ width: 360 }}>
          <Text style={{ alignSelf: 'center' }}>
            Last Backup: {lastBackup ? moment(lastBackup).fromNow() : 'Never'}
          </Text>
          <TextInput
            placeholder="Server address"
            value={serverAddress}
            onChangeText={text => ActionsClient.updateServer(text)}
          />
          {/* <View style={{ height: 10 }} />
          <Button
            title="Open Wallet Tool"
            color={colors.darkgray}
            onPress={() => {
              window.open(WALLET_TOOL_URL, '_blank');
              // Linking.openURL(WALLET_TOOL_URL)
            }}
          /> */}
          {/* <View style={{ height: 10 }} />
          <Button
            title="Open Block Explorer"
            color={colors.darkgray}
            onPress={() => {
              window.open(BLOCK_EXPLORER_URL[chain], '_blank');
              // Linking.openURL(BLOCK_EXPLORER_URL[chain])
            }}
          /> */}
          <View style={{ height: 10 }} />
          <Button
            title="Download"
            color={colors.darkgray}
            onPress={() => {
              ActionsSettings.downloadBackup();
              // this.flash('Copied Backup to Clipboard.');
            }}
          />
          <View style={{ height: 10 }} />
          <Button
            title="Copy"
            color={colors.darkgray}
            onPress={() => {
              ActionsSettings.copyBackup();
              // ActionsSettings.downloadBackup();
              this.flash('Copied Backup to Clipboard.');
            }}
          />
          <View style={{ height: 10 }} />
          <Button
            color={deleteWallet ? colors.red : colors.darkgray}
            title={deleteWallet ? 'Are you sure you want to reset?' : 'Reset'}
            onPress={() => {
              if (deleteWallet) {
                // ActionsSettings.copyBackup();
                ActionsSettings.downloadBackup();
                ActionsClient.clearAlice();
                // this.flash('Copied Backup to Clipboard.');
              } else {
                this.setState({ deleteWallet: true });
              }
            }}
          />
          <View style={{ height: 10 }} />
          <Button
            color={showSeed ? colors.red : colors.darkgray}
            title={showSeed ? 'Hide Seed' : 'Show Seed'}
            onPress={() => this.setState({ showSeed: !showSeed })}
          />
        </View>

        {showSeed && (
          <View>
            {/* <Text>Wallet Seed</Text> */}
            <ComponentTextLine
              onPress={() => {
                Clipboard.setString(publicSeed);
                this.flash('Copied wallet seed to clipboard.');
              }}
              text={publicSeed}
            />
            {/* <Text>Private Wallet Seed</Text>
            <ComponentTextLine
              onPress={() => {
                Clipboard.setString(privateSeed);
                this.flash('Copied private seed to clipboard.');
              }}
              text={privateSeed}
            /> */}
          </View>
        )}
        {!!coinRate && (
          <Text style={{ marginTop: 10, alignSelf: 'center' }}>
            ${coinRate} per {chain}
          </Text>
        )}

        <View style={{ flex: 1 }} />
        <Github />
      </View>
    );
  }
}

export default observer(Settings);
