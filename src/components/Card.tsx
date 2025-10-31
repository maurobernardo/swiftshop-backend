import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface Props {
    style?: ViewStyle;
    children: React.ReactNode;
}

export default function Card({ style, children }: Props) {
    return (
        <View style={{ backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: theme.colors.borderLight, padding: theme.spacing(3), ...theme.shadow.card, ...(style || {}) }}>
            {children}
        </View>
    );
}









