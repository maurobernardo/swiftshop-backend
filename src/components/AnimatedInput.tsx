import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	TextInput,
	Text,
	StyleSheet,
	Animated,
	TextInputProps,
	Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface AnimatedInputProps extends TextInputProps {
	label: string;
	error?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	rightIcon?: keyof typeof Ionicons.glyphMap;
	onRightIconPress?: () => void;
}

export default function AnimatedInput({
	label,
	error,
	icon,
	rightIcon,
	onRightIconPress,
	value,
	onFocus,
	onBlur,
	...props
}: AnimatedInputProps) {
	const [isFocused, setIsFocused] = useState(false);
	const focusAnim = useRef(new Animated.Value(0)).current;
	const shakeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.spring(focusAnim, {
			toValue: isFocused || value ? 1 : 0,
			tension: 80,
			friction: 10,
			useNativeDriver: false,
		}).start();
	}, [isFocused, value]);

	useEffect(() => {
		if (error) {
			Animated.sequence([
				Animated.timing(shakeAnim, {
					toValue: 10,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeAnim, {
					toValue: -10,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeAnim, {
					toValue: 10,
					duration: 50,
					useNativeDriver: true,
				}),
				Animated.timing(shakeAnim, {
					toValue: 0,
					duration: 50,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [error]);

	const handleFocus = (e: any) => {
		setIsFocused(true);
		onFocus?.(e);
	};

	const handleBlur = (e: any) => {
		setIsFocused(false);
		onBlur?.(e);
	};

	const labelStyle = {
		top: focusAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [18, 0],
		}),
		fontSize: focusAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [16, 12],
		}),
		color: focusAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [theme.colors.subtext, isFocused ? theme.colors.accent : theme.colors.text],
		}),
	};

	const borderColor = error
		? theme.colors.error
		: isFocused
		? theme.colors.accent
		: theme.colors.border;

	return (
		<Animated.View
			style={[
				styles.container,
				{ transform: [{ translateX: shakeAnim }] },
			]}
		>
			<Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
			<View style={[styles.inputContainer, { borderColor }]}>
				{icon && (
					<Ionicons
						name={icon}
						size={20}
						color={isFocused ? theme.colors.accent : theme.colors.subtext}
						style={styles.icon}
					/>
				)}
				<TextInput
					{...props}
					value={value}
					onFocus={handleFocus}
					onBlur={handleBlur}
					style={[
						styles.input,
						icon && styles.inputWithIcon,
						rightIcon && styles.inputWithRightIcon,
					]}
					placeholderTextColor={theme.colors.subtextLight}
				/>
				{rightIcon && (
					<Pressable onPress={onRightIconPress} style={styles.rightIcon}>
						<Ionicons
							name={rightIcon}
							size={20}
							color={theme.colors.subtext}
						/>
					</Pressable>
				)}
			</View>
			{error && <Text style={styles.error}>{error}</Text>}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
	},
	label: {
		position: 'absolute',
		left: 12,
		zIndex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 4,
		fontWeight: '600',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 2,
		borderRadius: 16,
		backgroundColor: theme.colors.card,
		marginTop: 8,
	},
	input: {
		flex: 1,
		height: 56,
		paddingHorizontal: 16,
		fontSize: 16,
		color: theme.colors.text,
	},
	inputWithIcon: {
		paddingLeft: 8,
	},
	inputWithRightIcon: {
		paddingRight: 8,
	},
	icon: {
		marginLeft: 16,
	},
	rightIcon: {
		padding: 16,
	},
	error: {
		color: theme.colors.error,
		fontSize: 12,
		marginTop: 4,
		marginLeft: 12,
		fontWeight: '500',
	},
});

