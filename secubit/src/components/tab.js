import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text } from 'react-native';
import { colors } from '../styles';

class ComponentTab extends Component {
  render() {
    const { selected, text, onPress } = this.props;
    return (
      <TouchableOpacity
        style={{
          borderWidth: 0.5,
          paddingTop: 12,
          paddingBottom: 12,
          width: 85,
          backgroundColor: selected ? colors.background : colors.background,
          borderTopColor: selected ? colors.lightgray : colors.background,
          borderLeftColor: selected ? colors.lightgray : colors.background,
          borderRightColor: selected ? colors.lightgray : colors.background,
          borderTopWidth: 0.5,
          borderLeftWidth: 0.5,
          borderRightWidth: 0.5,

          borderBottomColor: !selected ? colors.lightgray : colors.background,
          borderBottomWidth: 0.5,
          justifyContent: 'center',
        }}
        onPress={() => onPress && onPress()}
      >
        <Text style={{ fontSize: 20, textAlign: 'center' }}>{text}</Text>
      </TouchableOpacity>
    );
  }
}

ComponentTab.propTypes = {
  selected: PropTypes.bool,
  text: PropTypes.string,
  onPress: PropTypes.func,
};

export default ComponentTab;
