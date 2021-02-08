// Copyright 2015-2021 Parity Technologies (UK) Ltd.
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

import Separator from 'components/Separator';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import colors from 'styles/colors';
import fontStyles from 'styles/fontStyles';
import { hexToAscii, isAscii } from 'utils/strings';

export default function MessageDetailsCard({ data, isHash, message, style }: {
	isHash: boolean;
	message: string;
	data: string;
	style?: ViewStyle;
}): React.ReactElement {
	return (
		<>
			<Separator
				shadow={true}
				style={{
					height: 0,
					marginTop: 16
				}}
			/>
			<View style={[styles.messageContainer, style]}>
				<Text style={styles.titleText}>
					{isHash ? 'Message Hash' : 'Message'}
				</Text>
				{isHash ? (
					<Text style={styles.messageText}>{message}</Text>
				) : (
					<Text style={styles.messageText}>
						{isAscii(message) ? hexToAscii(message) : data}
					</Text>
				)}
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	messageContainer: { marginTop: 16 },
	messageText: {
		...fontStyles.t_code,
		color: colors.signal.main
	},
	titleText: {
		...fontStyles.h_subheading,
		marginBottom: 8
	}
});
