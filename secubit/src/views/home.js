import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View, Text } from 'react-native';
import ActionsSettings from '../actions/settings';
import ComponentTab from '../components/tab';
import store from '../store';
import PublicView from './public';
import PrivateView from './private';
import HistoryView from './history';
import Settings from './settings';
import { colors } from '../styles';
import { smallScreen } from '../helpers';

class Home extends Component {
  render() {
    const {
      settings: { routeTab, chain },
    } = store;
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap-reverse',
          }}
        >
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View
              style={{
                width: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.lightgray,
              }}
            />
            <ComponentTab
              text="Receive"
              selected={routeTab === 'Public'}
              onPress={() => ActionsSettings.goToPublic()}
            />
            <ComponentTab
              text="Send"
              selected={routeTab === 'Private'}
              onPress={() => ActionsSettings.goToPrivate()}
            />
            <ComponentTab
              text="History"
              selected={routeTab === 'History'}
              onPress={() => ActionsSettings.goToHistory()}
            />
            <ComponentTab
              text="Settings"
              selected={routeTab === 'Settings'}
              onPress={() => ActionsSettings.goToSettings()}
            />
          </View>
          <View
            style={{
              flex: 1,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.lightgray,
            }}
          />
          <View
            style={{
              marginLeft: smallScreen ? 10 : 0,
              paddingRight: smallScreen ? 20 : 0,
              paddingTop: smallScreen ? 4 : 0,
              borderBottomWidth: smallScreen ? 0 : 0.5,
              borderBottomColor: colors.lightgray,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                fontFamily: 'Courier',
              }}
            >
              SecuBit Wallet
            </Text>
            <View
              style={{
                position: 'absolute',
                top: 3,
                right: 1,
                padding: 2,
                borderRadius: 4,
                borderWidth: 0.5,
                backgroundColor: colors.background,
                borderColor: colors.gray,
                transform: [{ rotate: '16deg' }],
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Courier' }}>
                {chain}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {routeTab === 'Public' ? (
            <PublicView />
          ) : routeTab === 'Private' ? (
            <PrivateView />
          ) : routeTab === 'History' ? (
            <HistoryView />
          ) : routeTab === 'Settings' ? (
            <Settings />
          ) : (
            <Text>Unknown Tab</Text>
          )}
        </View>
      </View>
    );
  }
}

export default observer(Home);
