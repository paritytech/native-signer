// Copyright 2015-2019 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

// import QrScan from '@polkadot/ui-qr';
// import decodeAddress from '@polkadot/util-crypto';
import PropTypes from 'prop-types';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { Subscribe } from 'unstated';
import colors from '../colors';
import fonts from "../fonts";
import AccountsStore from '../stores/AccountsStore';
import ScannerStore from '../stores/ScannerStore';

export default class Scanner extends React.PureComponent {
  static navigationOptions = {
    title: 'Transaction Details',
    headerBackTitle: 'Scanner'
  };

  render() {
    return (
      <Subscribe to={[ScannerStore, AccountsStore]}>
        {(scannerStore, accountsStore) => {
          return (
            <QrScannerView
              navigation={this.props.navigation}
              scannerStore={scannerStore}
              onBarCodeRead={async txRequestData => {
                if (scannerStore.isBusy()) {
                  return;
                }
                let data = {};

                if (txRequestData.data) { // then this is Ethereum Legacy
                  if (data.action === undefined) {
                    throw new Error('Could not determine action type.');
                  }
                  data = JSON.parse(txRequestData.data);
                  
                  if (!(await scannerStore.setData(data, accountsStore))) {
                    return;
                  } else {
                    if (scannerStore.getType() === 'transaction') {
                      this.props.navigation.navigate('TxDetails');
                    } else { // message
                      this.props.navigation.navigate('MessageDetails');
                    }
                  }
                }
                // parse past the frame information
                let raw = txRequestData.rawData;
                let rawAfterFrames = raw.slice(13);

                // can't scope variables to switch case blocks....fml
                let zerothByte = rawAfterFrames.slice(0, 2);
                let firstByte = rawAfterFrames.slice(2, 4);
                let action;
                let address;
                let data = {};
                data['data'] = {}; // for consistency with legacy data format.

                try {
                  // decode payload appropriately via UOS
                  switch (zerothByte) {
                    case 45: // Ethereum UOS payload
                      action = firstByte === 0 || firstByte === 2 ? 'signData' : firstByte === 1 ? 'signTransaction' : null;
                      address = uosAfterFrames.slice(2, 22);

                      data['action'] = action;
                      data['data']['account'] = account;

                      if (action === 'signData') {
                        data['data']['rlp'] = uosAfterFrames[13];
                      } else if (action === 'signTransaction') {
                        data['data']['data'] = rawAfterFrames[13];
                      } else {
                        throw new Error('Could not determine action type.');
                      }
                      break;
                    case 53: // Substrate UOS payload
                      const crypto = firstByte === 0 ? 'ed25519' : firstByte === 1 ? 'sr25519' : null;
                      action = secondByte === 0 || secondByte === 1 ? 'signData': secondByte === 2 || secondByte === 3 ? 'signTransaction' : null;

                      data['action'] = action;
                      data['data']['crypto'] = crypto;
                      data['data']['account'] = uosAfterFrames.slice(3, 35);
                      data['data']['data'] = uosAfterFrames.slice(35);

                      break;
                    default:
                      throw new Error('we cannot handle the payload: ', txRequestData);
                  }
                } catch (e) {
                  scannerStore.setBusy();
                  Alert.alert('Unable to parse transaction', e.message, [
                    {
                      text: 'Try again',
                      onPress: () => {
                        scannerStore.cleanup();
                      }
                    }
                  ]);
                }
              }}
            />
          );
        }}
      </Subscribe>
    );
  }
}

export class QrScannerView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setBusySubscription = null;
    this.setReadySubscription = null;
  }

  static propTypes = {
    onBarCodeRead: PropTypes.func.isRequired
  };

  componentWillMount() {
    this.setBusySubscription = this.props.navigation.addListener(
      'willFocus',
      () => {
        this.props.scannerStore.setReady();
      }
    );
    this.setReadySubscription = this.props.navigation.addListener(
      'didBlur',
      () => {
        this.props.scannerStore.setBusy();
      }
    );
  }

  componentWillUnmount() {
    this.setBusySubscription.remove();
    this.setReadySubscription.remove();
  }

  render() {
    if (this.props.scannerStore.isBusy()) {
      return <View style={styles.inactive} />;
    }
    return (
      <RNCamera
        captureAudio={false}
        onBarCodeRead={this.props.onBarCodeRead}
        style={styles.view}
      >
        <View style={styles.body}>
          <View style={styles.top}>
            <Text style={styles.titleTop}>SCANNER</Text>
          </View>
          <View style={styles.middle}>
            <View style={styles.middleLeft} />
            <View style={styles.middleCenter} />
            <View style={styles.middleRight} />
          </View>
          <View style={styles.bottom}>
            <Text style={styles.descTitle}>Scan QR Code</Text>
            <Text style={styles.descSecondary}>To Sign a New Transaction</Text>
          </View>
        </View>
      </RNCamera>
    );
  }
}

const styles = StyleSheet.create({
  inactive: {
    backgroundColor: colors.bg,
    padding: 20,
    flex: 1,
    flexDirection: 'column'
  },
  view: {
    flex: 1,
    backgroundColor: 'black'
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent'
  },
  top: {
    flexBasis: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  middle: {
    flexBasis: 280,
    flexDirection: 'row',
    backgroundColor: 'transparent'
  },
  middleLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  middleCenter: {
    flexBasis: 280,
    borderWidth: 1,
    backgroundColor: 'transparent'
  },
  middleRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  bottom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  titleTop: {
    color: colors.bg_text,
    fontSize: 26,
    fontFamily: fonts.bold,
    textAlign: 'center'
  },
  descTitle: {
    color: colors.bg_text,
    fontSize: 18,
    fontFamily: fonts.bold,
    paddingBottom: 10,
    textAlign: 'center'
  },
  descSecondary: {
    color: colors.bg_text,
    fontSize: 14,
    fontFamily: fonts.bold,
    paddingBottom: 20,
  }
});

/*
Example Full Raw Data
---
4 // indicates binary
37 // indicates data length
00 // indicates multipart
0001 // frame count
0000 // first frame
--- UOS Specific Data
53 // indicates payload is for Substrate
01 // crypto: sr25519
00 // indicates action: signData
f4cd755672a8f9542ca9da4fbf2182e79135d94304002e6a09ffc96fef6e6c4c // public key
544849532049532053504152544121 // actual payload message to sign (should be SCALE)
0 // terminator
--- SQRC Filler Bytes
ec11ec11ec11ec // SQRC filler bytes
*/
function rawDataToU8A(rawData) {
  if (!rawData) {
    return null;
  }

  // Strip filler bytes padding at the end
  if (rawData.substr(-2) === 'ec') {
    rawData = rawData.substr(0, rawData.length - 2);
  }

  while (rawData.substr(-4) === 'ec11') {
    rawData = rawData.substr(0, rawData.length - 4);
  }

  // Verify that the QR encoding is binary and it's ending with a proper terminator
  if (rawData.substr(0, 1) !== '4' || rawData.substr(-1) !== '0') {
    return null;
  }

  // Strip the encoding indicator and terminator for ease of reading
  rawData = rawData.substr(1, rawData.length - 2);

  const length8 = parseInt(rawData.substr(0, 2), 16) || 0;
  const length16 = parseInt(rawData.substr(0, 4), 16) || 0;
  let length = 0;

  // Strip length prefix
  if (length8 * 2 + 2 === rawData.length) {
    rawData = rawData.substr(2);
    length = length8;
  } else if (length16 * 2 + 4 === rawData.length) {
    rawData = rawData.substr(4);
    length = length16;
  } else {
    return null;
  }

  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(rawData.substr(i * 2, 2), 16);
  }

  return bytes;
}
