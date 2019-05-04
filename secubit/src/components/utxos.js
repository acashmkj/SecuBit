import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View, Text, FlatList, Button } from 'react-native';
import { colors } from '../styles';
import { formatSat, smallScreen } from '../helpers';
import store from '../store';
import moment from 'moment';

class ComponentUtxo extends Component {
  render() {
    const { computedAllUtxos, coinRate } = store;

    return (
      <FlatList
        keyExtractor={item => item.x}
        data={computedAllUtxos.get()}
        extraData={computedAllUtxos.get().map(obj => obj.u)}
        style={{ alignSelf: 'center' }}
        renderItem={({ item: round }) => {
          if (!round.o) return <View />;
          return (
            <View
              style={{
                padding: 6,
                paddingRight: 0,
                margin: 3,
                borderWidth: 1,
                borderColor: colors.lightgray,
                backgroundColor:
                  !!round.u || !round.o ? colors.red : colors.green,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>Type: </Text>
                {!round.b && <Text>Spending change</Text>}
                {!!round.b && <Text>CoinJoin transaction</Text>}
              </View>
              {round.b > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold' }}>SecuBits Mixed: </Text>
                  <Text style={{}}>{round.b}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>Amount: </Text>
                <Text style={{}}>
                  {formatSat(round.o, coinRate).bits},{' '}
                  {formatSat(round.o, coinRate, true).usd}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>Address: </Text>
                <Text style={{ flex: 1, fontSize: smallScreen ? 10 : 12 }}>
                  {round.a}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: smallScreen ? 13 : 14,
                    fontWeight: 'bold',
                  }}
                >
                  TXID:{' '}
                </Text>
                <Text style={{ flex: 1, fontSize: smallScreen ? 8 : 10 }}>
                  {round.x}
                </Text>
              </View>
              {!!round.f && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: smallScreen ? 13 : 14,
                      fontWeight: 'bold',
                    }}
                  >
                    From:{' '}
                  </Text>
                  <Text style={{ flex: 1, fontSize: smallScreen ? 8 : 10 }}>
                    {round.f}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>Date: </Text>
                <Text style={{}}>{`${moment(round.d).format(
                  'MMMM Do YYYY, H:mm:ss'
                )}  (${moment(round.d).fromNow()})`}</Text>
              </View>
              {/* {Object.keys(r).map((key, index) => {
                return (
                  <Text key={index}>
                    <Text style={{ fontWeight: 'bold' }}>{key}:</Text>{' '}
                    {`${r[key]}`}
                  </Text>
                );
              })} */}
              <View
                style={{
                  marginTop: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
              >
                <Button
                  onPress={() => {
                    setTimeout(() => {
                      round.u = !round.u;
                      store.saveRounds();
                    }, 100);
                  }}
                  // color={round.u ? colors.green : colors.red}
                  // color={colors.gray}
                  title={round.u ? 'Enable' : 'Disable'}
                />
                <Text style={{ fontWeight: 'bold', marginLeft: 10 }}>
                  {round.u ? 'Spent!' : 'Unspent'}
                </Text>
              </View>
            </View>
          );
        }}
      />
    );
  }
}

export default observer(ComponentUtxo);
