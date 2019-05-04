import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, View, Text } from 'react-native';
import { colors } from '../styles';

class ComponentArrow extends Component {
  render() {
    const {
      onPressUp,
      onPressDown,
      value,
      // onValueChange,
      disabled,
    } = this.props;

    return (
      <View style={{ alignItems: 'center', marginLeft: 10 }}>
        <TouchableOpacity disabled={disabled} onPress={() => onPressUp()}>
          <View
            style={{
              width: 40,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 22,
                color: disabled ? colors.darkgray : colors.white,
              }}
            >
              ^
            </Text>
          </View>
        </TouchableOpacity>
        <Text style={{ fontSize: 16 }}>{value}</Text>
        <TouchableOpacity
          disabled={value <= 0 || disabled}
          onPress={() => onPressDown()}
        >
          <View
            style={{
              width: 40,
              height: 30,
              transform: [{ rotate: '180deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 22,
                color:
                  value <= 0 || disabled ? colors.background : colors.darkgray,
              }}
            >
              ^
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

ComponentArrow.propTypes = {
  onPressUp: PropTypes.func,
  onPressDown: PropTypes.func,
  value: PropTypes.any,
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default ComponentArrow;
