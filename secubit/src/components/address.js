import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, View, Clipboard, Text } from 'react-native';
import QRCode from './qrcode';
import ComponentArrow from './arrow';
import { smallScreen } from '../helpers';
import { colors } from '../styles';

class ComponentAddress extends Component {
  render() {
    const {
      onPressUp,
      onPressDown,
      address,
      value,
      flashMessage,
      disableIncrementor,
    } = this.props;
    const fontSize = smallScreen ? 12 : 16;
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize,
            margin: 4,
            marginTop: 12,
            marginBottom: 12,
            color: colors.gray,
          }}
        >
          {address}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(address);
              flashMessage('Copied Address');
            }}
            style={{
              width: 120,
              height: 120,
              backgroundColor: 'white',
            }}
          >
            <QRCode address={address} />
          </TouchableOpacity>

          {!disableIncrementor && (
            <ComponentArrow
              onPressUp={() => onPressUp()}
              onPressDown={() => onPressDown()}
              value={value}
              disabled={false}
            />
          )}
        </View>

        {/* {!!privateKey && (
          <TouchableOpacity
            style={{
              width: 120,
              height: 120,
              marginLeft: 12,
              margin: 4,
              borderWidth: showPrivate ? 0 : 0.5,
              borderColor: colors.white,
              backgroundColor: 'white',
            }}
            onPress={() => {
              if (!showPrivate) {
                Clipboard.setString(privateKey);
                flashMessage('Copied private key');
              }
              this.setState({ showPrivate: !showPrivate });
            }}
          >
            {showPrivate ? (
              <QRCode address={privateKey} />
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <Text style={{ textAlign: 'center' }}>Copy Private Key</Text>
              </View>
            )}
          </TouchableOpacity>
        )} */}
      </View>
    );
  }
}

ComponentAddress.propTypes = {
  title: PropTypes.string,
  onPressUp: PropTypes.func,
  onPressDown: PropTypes.func,
  address: PropTypes.string,
  privateKey: PropTypes.string,
  onValueChange: PropTypes.func,
  value: PropTypes.any,
  derivePath: PropTypes.string,
  balance: PropTypes.number,
  ticker: PropTypes.string,
  wholeNumbers: PropTypes.bool,
  flashMessage: PropTypes.func,
  simpleMode: PropTypes.bool,
  privateAddress: PropTypes.bool,
  disableIncrementor: PropTypes.bool,
  date: PropTypes.any,
  secubits: PropTypes.number,
};

export default ComponentAddress;
