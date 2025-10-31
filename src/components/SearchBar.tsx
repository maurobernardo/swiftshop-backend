import React from 'react';
import { View, TextInput } from 'react-native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
	value: string;
	onChangeText: (t: string) => void;
	placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Search' }: Props) {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border }}>
			<Ionicons name="search" size={18} color={theme.colors.primary} />
			<TextInput placeholder={placeholder} value={value} onChangeText={onChangeText} style={{ flex: 1, marginLeft: 8, color: theme.colors.primary }} placeholderTextColor={theme.colors.primary} selectionColor={theme.colors.accent} />
		</View>
	);
}
