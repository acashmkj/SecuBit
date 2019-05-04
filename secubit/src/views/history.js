import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../styles';
import { formatSat } from '../helpers';
import { BLOCK_TXID_URL } from '../config';
import store from '../store';
import moment from 'moment';

class HistoryView extends Component {
  render() {
    const {
      coinRate,
      completedRounds,
      settings: { chain },
    } = store;

    return (
      <View style={{ flex: 1 }}>
        {completedRounds.length === 0 && (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>
              No Previous Transactions.
            </Text>
            <Text style={{ color: colors.gray }}>
              Send bitcoin to your receiving address to get started.
            </Text>
          </View>
        )}
        {completedRounds.length > 0 && (
          <FlatList
            keyExtractor={item => item.x}
            data={completedRounds}
            style={{ alignSelf: 'center' }}
            renderItem={({ item: round }) => {
              return (
                <TouchableOpacity
                  disabled={!round.x}
                  onPress={() => {
                    // Linking.openURL(BLOCK_TXID_URL(chain, round.x))
                    window.open(BLOCK_TXID_URL(chain, round.x), '_blank');
                  }}
                  style={{
                    padding: 6,
                    margin: 5,
                    borderWidth: 0.5,
                    borderColor: colors.lightgray,
                  }}
                >
                  {!!round.e && (
                    <Text style={{ color: colors.red }}>{round.e}</Text>
                  )}
                  {!round.e &&
                    !!round.s && (
                      <Text style={{ fontSize: 17 }}>
                        <Text style={{ fontWeight: 'bold' }}>
                          {formatSat(round.t, round.r || coinRate).usd}
                        </Text>{' '}
                        Sent{'\n'}
                        <Text style={{ fontSize: 12, color: colors.gray }}>
                          {round.s}
                        </Text>
                      </Text>
                    )}
                  {!round.e &&
                    !round.s && (
                      <Text style={{ fontSize: 17 }}>
                        <Text style={{ fontWeight: 'bold' }}>
                          {formatSat(round.o, round.r || coinRate).usd}
                        </Text>{' '}
                        Received{'\n'}
                        <Text style={{ fontSize: 12, color: colors.gray }}>
                          {round.b} secubits joined
                        </Text>
                      </Text>
                    )}
                  <Text style={{ fontSize: 12, color: colors.gray }}>
                    {moment(round.d).fromNow()}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }
}

export default observer(HistoryView);
