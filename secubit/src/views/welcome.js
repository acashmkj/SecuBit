import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View, Text, Button, Switch } from 'react-native';
import Github from '../components/github';
import TextInput from '../components/textinput';
import ActionsClient from '../actions/client';
import ActionsSettings from '../actions/settings';
import { colors } from '../styles';

class Welcome extends Component {
  constructor() {
    super();
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.state = {
      testnet: true,
    };
  }

  handleFileSelect(evt) {
    try {
      const file = evt.target.files[0];
      const reader = new FileReader();
      reader.onload = event => {
        console.log('onload', event.target.result);
        ActionsSettings.setBackup(event.target.result);
      };
      reader.readAsText(file);
    } catch (err) {
      console.log('Could not read file', err);
      alert('Could not read file');
    }
  }

  componentDidMount() {
    this.files = document.getElementById('files');
    this.files.addEventListener('change', this.handleFileSelect, false);
  }
  componentWillUnmount() {
    this.files.removeEventListener('change', this.handleFileSelect, false);
  }
  render() {
    const { testnet } = this.state;
    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 34, fontWeight: 'bold', textAlign: 'center' }}>
          Welcome to SecuBit Wallet
        </Text>
        <Text
          style={{
            margin: 10,
            marginTop: 20,
            color: colors.gray,
            maxWidth: 500,
          }}
        >
          SecuBit Wallet was created to help preserve Bitcoins fungibility. Today it
          is easy to trace bitcoin transactions from address to address by
          simply using any public Block Explorer. SecuBit Wallet helps fix this.
        </Text>
        <View style={{ marginTop: 20, flexDirection: 'row' }}>
          <View style={{ margin: 10 }}>
            <Button
              color="green"
              title="  Start BTC  "
              onPress={() => {
                ActionsClient.start(testnet ? 'tBTC' : 'BTC');
                // ActionsSettings.copyBackup();
                ActionsSettings.downloadBackup();
              }}
            />
          </View>
          <View style={{ margin: 10 }}>
            <Button
              color="green"
              style={{ padding: 4, minWidth: 110 }}
              title="  Start BCH  "
              onPress={() => {
                ActionsClient.start(testnet ? 'tBCH' : 'BCH');
                // ActionsSettings.copyBackup();
                ActionsSettings.downloadBackup();
              }}
            />
          </View>
        </View>
        <View
          style={{
            marginTop: 16,
            width: 120,
            height: 100,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 6,
            borderColor: 'lightgray',
            borderStyle: 'dashed',
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: 'lightgray',
              textAlign: 'center',
              // fontWeight: 'bold',
              userSelect: 'none',
            }}
          >
            OR {'\n'}
            drag and drop backup to restore
          </Text>
        </View>
        <View style={{ height: 8 }} />
        <input type="file" id="files" name="files" style={{ width: 220 }} />
        <TextInput
          placeholder="or paste in backup or seed"
          value=""
          onChangeText={text => {
            if (ActionsClient.isValidSeed(text)) {
              const result = window.confirm(`
Click OK for BCH

Click CANCEL for BTC`);
              if (result) {
                ActionsClient.start(testnet ? 'tBCH' : 'BCH', text);
              } else {
                ActionsClient.start(testnet ? 'tBTC' : 'BTC', text);
              }
            } else {
              ActionsSettings.setBackup(text);
            }
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text>{testnet ? 'Testnet' : 'Mainnet'}</Text>
          <View style={{ width: 10 }} />
          <Switch
            value={!testnet}
            onValueChange={value => this.setState({ testnet: !value })}
          />
        </View>
        <View style={{ flex: 1 }} />
        <Github />
      </View>
    );
  }
}

export default observer(Welcome);
