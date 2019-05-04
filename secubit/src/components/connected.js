import React, { Component } from 'react';
import Spinner from '../components/spinner';
import { View, Text } from 'react-native';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';

class ComponentConnected extends Component {
  render() {
    const { roundInfo } = store;
    const color = 'white';
    return (
      <View
        style={{
          backgroundColor: roundInfo.isConnected ? colors.green : colors.red,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
        }}
      >
        {!roundInfo.isConnected && <Text style={{ color }}>Connecting...</Text>}
        {!roundInfo.isConnected && (
          <Spinner
            style={{
              marginLeft: 12,
              width: 16,
              height: 16,
              borderWidth: 4,
              borderTopWidth: 4,
            }}
            small={true}
          />
        )}
        {/* {roundInfo.isDisconnected === true && (
          <Text style={{ color }}>Disconnected</Text>
        )} */}
        {roundInfo.isConnected &&
          !roundInfo.min_pool && <Text style={{ color }}>Connected</Text>}
        {roundInfo.isConnected &&
          roundInfo.joined < roundInfo.min_pool && (
            <Text style={{ color }}>
              {roundInfo.joined} of {roundInfo.min_pool} joined. Waiting for
              more users...
            </Text>
          )}
        {roundInfo.isConnected &&
          roundInfo.joined >= roundInfo.min_pool && (
            <Text style={{ color }}>
              {roundInfo.joined} of {roundInfo.min_pool} joined. Rounds started.
            </Text>
          )}
      </View>
    );
  }
}

export default observer(ComponentConnected);
