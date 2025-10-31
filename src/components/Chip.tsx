import React, { useRef } from 'react';
import { Text, View, ViewStyle, Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
	label: string;
	active?: boolean;
	style?: ViewStyle;
	onPress?: () => void;
	iconName?: string;
}

export default function Chip({ label, active, style, onPress, iconName }: Props) {
    const scale = useRef(new Animated.Value(1)).current;
    const onDown = () => Animated.timing(scale, { toValue: 0.96, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    const onUp = () => Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    return (
        <Animated.View style={[{ transform: [{ scale }] }]}>
            <Pressable onPress={onPress} onPressIn={onDown} onPressOut={onUp} style={[{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radii.md, borderWidth: 1, borderColor: active ? theme.colors.accent : theme.colors.border, backgroundColor: active ? theme.colors.accentSoft : 'white' }, style]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {iconName ? <Ionicons name={iconName as any} size={14} color={active ? theme.colors.accent : theme.colors.text} /> : null}
                    <Text style={{ color: active ? theme.colors.accent : theme.colors.text, fontWeight: '600' }}>{label}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}


