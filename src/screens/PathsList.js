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

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
	NETWORK_LIST,
	NetworkProtocols,
	UnknownNetworkKeys
} from '../constants';
import { withAccountStore } from '../util/HOC';
import { withNavigation } from 'react-navigation';
import {
	getPathsWithSubstrateNetwork,
	groupPaths,
	removeSlash
} from '../util/identitiesUtils';
import ButtonNewDerivation from '../components/ButtonNewDerivation';
import PathCard from '../components/PathCard';
import { PathDetailsView } from './PathDetails';
import testIDs from '../../e2e/testIDs';

import Separator from '../components/Separator';
import fontStyles from '../fontStyles';
import colors from '../colors';
import ButtonMainAction from '../components/ButtonMainAction';
import { PathListHeading } from '../components/ScreenHeading';

function PathsList({ accounts, navigation }) {
	const networkKey = navigation.getParam(
		'networkKey',
		UnknownNetworkKeys.UNKNOWN
	);

	const { currentIdentity } = accounts.state;
	const isEthereumPath =
		NETWORK_LIST[networkKey].protocol === NetworkProtocols.ETHEREUM;
	const isUnknownNetworkPath =
		NETWORK_LIST[networkKey].protocol === NetworkProtocols.UNKNOWN;
	const pathsGroups = useMemo(() => {
		if (!currentIdentity || isEthereumPath) return null;
		const paths = Array.from(currentIdentity.meta.keys());
		const listedPaths = getPathsWithSubstrateNetwork(paths, networkKey);
		return groupPaths(listedPaths);
	}, [currentIdentity, isEthereumPath, networkKey]);

	if (!currentIdentity) return null;
	if (isEthereumPath) {
		return (
			<PathDetailsView
				networkKey={networkKey}
				path={networkKey}
				navigation={navigation}
				accounts={accounts}
			/>
		);
	}

	const { navigate } = navigation;

	const renderSinglePath = pathsGroup => {
		const path = pathsGroup.paths[0];
		return (
			<PathCard
				key={path}
				testID={testIDs.PathsList.pathCard + path}
				identity={currentIdentity}
				path={path}
				onPress={() => navigate('PathDetails', { path })}
			/>
		);
	};

	const renderGroupPaths = pathsGroup => (
		<View key={`group${pathsGroup.title}`} style={{ marginTop: 24 }}>
			<View
				style={{
					backgroundColor: colors.bg,
					height: 64,
					marginBottom: 14
				}}
			>
				<Separator
					shadow={true}
					style={{
						backgroundColor: 'transparent',
						height: 0,
						marginVertical: 0
					}}
				/>
				<View
					style={{
						alignItems: 'center',
						flexDirection: 'row',
						justifyContent: 'space-between',
						marginTop: 16,
						paddingHorizontal: 16
					}}
				>
					<View>
						<Text style={fontStyles.t_prefix}>
							{removeSlash(pathsGroup.title)}
						</Text>
						<Text style={fontStyles.t_codeS}>
							{NETWORK_LIST[networkKey].pathId}
							{pathsGroup.title}
						</Text>
					</View>

					{/*<ButtonIcon*/}
					{/*	iconName="plus"*/}
					{/*	iconType="antdesign"*/}
					{/*	style={{ opacity: 0.5 }}*/}
					{/*	onPress={() =>*/}
					{/*		navigation.navigate('PathDerivation', { networkKey })*/}
					{/*	}*/}
					{/*/>*/}
				</View>
			</View>
			{pathsGroup.paths.map(path => (
				<View key={path} style={{ marginBottom: -8 }}>
					<PathCard
						key={path}
						testID={testIDs.PathsList.pathCard + path}
						identity={currentIdentity}
						path={path}
						onPress={() => navigate('PathDetails', { path })}
					/>
				</View>
			))}
		</View>
	);

	const subtitle =
		networkKey === UnknownNetworkKeys.UNKNOWN
			? ''
			: `//${NETWORK_LIST[networkKey].pathId}`;
	return (
		<View style={styles.body}>
			<PathListHeading
				title={NETWORK_LIST[networkKey].title}
				subtitle={subtitle}
				subtitleIcon={true}
			/>
			<ScrollView>
				{pathsGroups.map(pathsGroup =>
					pathsGroup.paths.length === 1
						? renderSinglePath(pathsGroup)
						: renderGroupPaths(pathsGroup)
				)}
				{!isUnknownNetworkPath && (
					<ButtonNewDerivation
						testID={testIDs.PathsList.deriveButton}
						title="Create New Derivation"
						onPress={() =>
							navigation.navigate('PathDerivation', { networkKey })
						}
					/>
				)}
			</ScrollView>
			<ButtonMainAction
				title={'Scan'}
				onPress={() => navigation.navigate('QrScanner')}
			/>
		</View>
	);
}

export default withAccountStore(withNavigation(PathsList));

const styles = StyleSheet.create({
	body: {
		backgroundColor: colors.bg,
		flex: 1,
		flexDirection: 'column'
	}
});
