import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text } from 'react-native';
import { formatSat, smallScreen, satToRate, rateToSat } from '../helpers';
import { colors } from '../styles';

const NumButton = ({ press, text }) => {
  return (
    <TouchableOpacity
      style={{
        height: smallScreen ? 50 : 60,
        width: 86,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => press(text)}
    >
      <Text style={{ color: colors.gray, fontSize: 30 }}>{text}</Text>
    </TouchableOpacity>
  );
};

NumButton.propTypes = {
  text: PropTypes.string,
  press: PropTypes.func,
};

class ComponentNumPad extends Component {
  constructor(props) {
    super(props);
    this.onPress = this.onPress.bind(this);
    this.state = {
      showUsd: props.rate ? true : false,
    };
  }
  componentWillReceiveProps(newProps) {
    if (!this.props.rate && newProps.rate) {
      this.setState({ showUsd: true });
    }
  }
  onPress(number) {
    const { max, flash, onChange, value, rate } = this.props;
    const { showUsd } = this.state;
    let newValue;
    if (showUsd) {
      const previousUsd = satToRate(value, rate * 100).toFixed(0);
      if (number === '<') {
        newValue = previousUsd.toString().slice(0, -1);
      } else {
        newValue = `${previousUsd}${number}`;
      }
      if (!newValue) {
        newValue = '0';
      }
      newValue = rateToSat(newValue, rate * 100)
        .toFixed(0)
        .toString();
    } else {
      newValue = value.toString().slice(0, -2);
      if (number === '<') {
        newValue = newValue.toString().slice(0, -1);
      } else {
        newValue = `${newValue}${number}`;
      }
      if (!newValue) {
        newValue = '0';
      }
      newValue = `${newValue}00`;
    }

    if (newValue > max) {
      const price = showUsd
        ? formatSat(max, rate).usd
        : formatSat(max, rate).bits;
      flash(`To keep privacy the max send is ${price}`);
      return onChange(max, showUsd);
    }
    onChange(newValue, showUsd);
  }
  render() {
    const { showUsd } = this.state;
    const { value, rate, onChange } = this.props;

    const price = showUsd
      ? formatSat(value, rate).usd
      : formatSat(value, rate).bits;

    return (
      <View style={{ alignSelf: 'center' }}>
        <TouchableOpacity
          onPress={() => {
            const nextUsd = !rate ? false : !showUsd;
            this.setState({ showUsd: nextUsd });
            onChange(value, nextUsd);
          }}
        >
          <Text
            style={{ alignSelf: 'center', fontSize: 32, fontWeight: 'bold' }}
          >
            {price}
          </Text>
        </TouchableOpacity>
        <View style={{ height: smallScreen ? 2 : 10 }} />
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={this.onPress} text="1" />
          <NumButton press={this.onPress} text="2" />
          <NumButton press={this.onPress} text="3" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={this.onPress} text="4" />
          <NumButton press={this.onPress} text="5" />
          <NumButton press={this.onPress} text="6" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={this.onPress} text="7" />
          <NumButton press={this.onPress} text="8" />
          <NumButton press={this.onPress} text="9" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <NumButton press={() => {}} text=" " />
          <NumButton press={this.onPress} text="0" />
          <NumButton press={this.onPress} text="<" />
        </View>
      </View>
    );
  }
}

ComponentNumPad.propTypes = {
  rate: PropTypes.number, // Bits
  max: PropTypes.number, // Bits
  onChange: PropTypes.func,
  flash: PropTypes.func,
  value: PropTypes.any, // Bits
};

export default ComponentNumPad;
