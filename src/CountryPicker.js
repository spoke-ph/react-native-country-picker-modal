/**
 * react-native-country-picker
 * @author xcarpentier<contact@xaviercarpentier.com>
 * @flow
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Image, TouchableOpacity, Modal, Text, ListView, Platform } from 'react-native';
import R from 'ramda';
import nodeEmoji from 'node-emoji';

import cca2List from '../data/cca2';
import { getHeightPercent } from './ratio';
import CloseButton from './CloseButton';
import styles from './CountryPicker.style';
import countries from '../data/countries-emoji';

const Emoji = ({ name } = {}) => { // had to replace react-native-emoji b/c of PropTypes error
  const emoji = nodeEmoji.get(name);
  const fontSize = Platform.OS === 'ios' ? 30 : 25;
  return (<Text style={{ fontSize }}>{emoji}</Text>);
};

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
const countriesDs = ds.cloneWithRows(cca2List);

export const getAllCountries = () => countries;

export default class CountryPicker extends Component {
  static propTypes = {
    cca2: PropTypes.string.isRequired,
    translation: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    closeable: PropTypes.bool,
    children: PropTypes.node,
    hideAlphabet: PropTypes.bool
  }

  static defaultProps = {
    translation: 'eng',
  }

  state = {
    modalVisible: false
  };

  onSelectCountry(cca2) {
    this.setState({
      modalVisible: false,
    });

    this.props.onChange({
      cca2,
      ...countries[cca2],
      flag: undefined,
      name: this.getCountryName(countries[cca2]),
    });
  }

  getCountryName(country, optionalTranslation) {
    const translation = optionalTranslation || this.props.translation || 'eng';
    return country.name[translation] || country.name.common;
  }

  setVisibleListHeight(offset) {
    this.visibleListHeight = getHeightPercent(100) - offset;
  }

  openModal = this.openModal.bind(this);
  letters = R
    .range('A'.charCodeAt(0), 'Z'.charCodeAt(0) + 1)
    .map(n => String.fromCharCode(n).substr(0));

  // dimensions of country list and window
  itemHeight = getHeightPercent(7);
  listHeight = countries.length * this.itemHeight;

  openModal() {
    this.setState({ modalVisible: true });
  }

  scrollTo(letter) {
    // find position of first country that starts with letter
    const index = this.state.cca2List.map((country) => countries[country].name.common[0])
      .indexOf(letter);
    if (index === -1) {
      return;
    }
    let position = index * this.itemHeight;

    // do not scroll past the end of the list
    if (position + this.visibleListHeight > this.listHeight) {
      position = this.listHeight - this.visibleListHeight;
    }

    // scroll
    this._listView.scrollTo({
      y: position,
    });
  }

  renderCountry(country, index) {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => this.onSelectCountry(country)}
      >
        {this.renderCountryDetail(country)}
      </TouchableOpacity>
    );
  }

  renderLetters(letter, index) {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => this.scrollTo(letter)}
        activeOpacity={0.6}
        style={{ paddingHorizontal: 10 }}
      >
        <View style={styles.letter}>
          <Text style={styles.letterText}>{letter}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  renderCountryDetail(cca2) {
    const country = countries[cca2];
    return (
      <View style={styles.itemCountry}>
        {this.renderFlag(cca2)}
        <View style={styles.itemCountryName}>
          <Text style={styles.countryName}>
            {this.getCountryName(country)}
          </Text>
        </View>
      </View>
    );
  }

  renderEmojiFlag(cca2) {
    return (
      <Text style={styles.emojiFlag}>
        <Emoji name={countries[cca2].flag} />
      </Text>
    );
  }

  renderImageFlag(cca2) {
    return (
      <Image
        style={styles.imgStyle}
        source={{ uri: countries[cca2].flag }}
      />
    );
  }

  renderFlag(cca2) {
    return (
      <View style={styles.itemCountryFlag}>
        {this.renderEmojiFlag(cca2)}
      </View>
    );
  }

  render() {
    return (
      <View>
        <TouchableOpacity
          onPress={() => this.setState({ modalVisible: true })}
          activeOpacity={0.7}
        >
          {this.props.children || null}
        </TouchableOpacity>
        <Modal
          visible={this.state.modalVisible}
          onRequestClose={() => this.setState({ modalVisible: false })}
        >
          <View style={styles.modalContainer}>
            {
              this.props.closeable &&
              <CloseButton onPress={() => this.setState({ modalVisible: false })} />
            }
            <ListView
              contentContainerStyle={styles.contentContainer}
              ref={listView => this._listView = listView}
              dataSource={countriesDs}
              renderRow={country => this.renderCountry(country)}
              initialListSize={30}
              pageSize={countries.length - 30}
              onLayout={
                ({ nativeEvent: { layout: { y: offset } } }) => this.setVisibleListHeight(offset)
              }
            />
            {!this.props.hideAlphabet && <View style={[styles.letters, { right: 0 }]}>
              {this.letters.map((letter, index) => this.renderLetters(letter, index))}
            </View>}
          </View>
        </Modal>
      </View>
    );
  }
}
