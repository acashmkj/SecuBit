import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { colors } from '../styles';
import { TouchableOpacity, Text } from 'react-native';
import { smallScreen } from '../helpers';

class ComponentTextLine extends Component {
  render() {
    const { text, style, onPress } = this.props;
    return (
      <TouchableOpacity
        onPress={() => onPress && onPress()}
        style={{
          flexDirection: 'row',
          backgroundColor: colors.background,
          margin: 4,
          padding: 10,
          shadowRadius: 4,
          shadowOpacity: 0.5,
          shadowColor: colors.black,
          shadowOffset: { width: 1, height: 1 },
          ...style,
        }}
      >
        <Text style={{ fontSize: smallScreen ? 16 : 20 }}>{text}</Text>
      </TouchableOpacity>
    );
  }
}

ComponentTextLine.propTypes = {
  text: PropTypes.string,
  style: PropTypes.object,
  onPress: PropTypes.func,
};

export default ComponentTextLine;
