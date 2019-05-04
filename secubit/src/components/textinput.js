import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, Button } from 'react-native';
import { colors } from '../styles';
import { smallScreen } from '../helpers';

class ComponentTextInput extends Component {
  render() {
    const {
      value,
      onChangeText,
      placeholder,
      editable,
      style,
      textStyle,
      onSubmitEditing,
      onBlur,
      onButtonPress,
      buttonText,
    } = this.props;

    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.background,
          margin: 4,
          shadowRadius: 4,
          shadowOpacity: 0.3,
          shadowColor: colors.black,
          shadowOffset: { width: 1, height: 1 },
          ...style,
        }}
      >
        {onButtonPress && (
          <Button title={buttonText} onPress={() => onButtonPress()} />
        )}
        <TextInput
          placeholder={placeholder}
          value={value}
          editable={editable}
          onChangeText={text => onChangeText && onChangeText(text)}
          onSubmitEditing={() => onSubmitEditing && onSubmitEditing()}
          onBlur={() => onBlur && onBlur()}
          style={{
            flex: 1,
            marginLeft: smallScreen ? 8 : 16,
            marginRight: 4,
            fontSize: smallScreen ? 16 : 18,
            height: smallScreen ? 30 : 40,
            color: colors.white,
            ...textStyle,
          }}
        />
      </View>
    );
  }
}

ComponentTextInput.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  editable: PropTypes.bool,
  style: PropTypes.object,
  textStyle: PropTypes.object,
  onSubmitEditing: PropTypes.func,
  onBlur: PropTypes.func,
  onButtonPress: PropTypes.func,
  buttonText: PropTypes.string,
};

export default ComponentTextInput;
