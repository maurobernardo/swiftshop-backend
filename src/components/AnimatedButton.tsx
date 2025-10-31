import React, { useRef } from 'react';
import {
	Pressable,
	Text,
	StyleSheet,
	Animated,
	ActivityIndicator,
	ViewStyle,
	TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface AnimatedButtonProps {
	title: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	size?: 'small' | 'medium' | 'large';
	loading?: boolean;
	disabled?: boolean;
	icon?: keyof typeof Ionicons.glyphMap;
	iconPosition?: 'left' | 'right';
	style?: ViewStyle;
	textStyle?: TextStyle;
	fullWidth?: boolean;
}

export default function AnimatedButton({
	title,
	onPress,
	variant = 'primary',
	size = 'medium',
	loading = false,
	disabled = false,
	icon,
	iconPosition = 'left',
	style,
	textStyle,
	fullWidth = false,
}: AnimatedButtonProps) {
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const isDisabled = disabled || loading;

	const handlePressIn = () => {
		if (!isDisabled) {
			Animated.spring(scaleAnim, {
				toValue: 0.96,
				tension: 300,
				friction: 10,
				useNativeDriver: true,
			}).start();
		}
	};

	const handlePressOut = () => {
		if (!isDisabled) {
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 300,
				friction: 10,
				useNativeDriver: true,
			}).start();
		}
	};

	const sizeStyles = {
		small: styles.buttonSmall,
		medium: styles.buttonMedium,
		large: styles.buttonLarge,
	};

	const textSizeStyles = {
		small: styles.textSmall,
		medium: styles.textMedium,
		large: styles.textLarge,
	};

	const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;

	const renderContent = () => (
		<>
			{loading ? (
				<ActivityIndicator
					color={variant === 'outline' || variant === 'ghost' ? theme.colors.accent : '#fff'}
					size="small"
				/>
			) : (
				<>
					{icon && iconPosition === 'left' && (
						<Ionicons
							name={icon}
							size={iconSize}
							color={
								variant === 'outline' || variant === 'ghost'
									? theme.colors.accent
									: '#fff'
							}
							style={styles.iconLeft}
						/>
					)}
					<Text
						style={[
							styles.text,
							textSizeStyles[size],
							variant === 'outline' && styles.textOutline,
							variant === 'ghost' && styles.textGhost,
							variant === 'secondary' && styles.textSecondary,
							isDisabled && styles.textDisabled,
							textStyle,
						]}
					>
						{title}
					</Text>
					{icon && iconPosition === 'right' && (
						<Ionicons
							name={icon}
							size={iconSize}
							color={
								variant === 'outline' || variant === 'ghost'
									? theme.colors.accent
									: '#fff'
							}
							style={styles.iconRight}
						/>
					)}
				</>
			)}
		</>
	);

	const buttonStyle = [
		styles.button,
		sizeStyles[size],
		fullWidth && styles.fullWidth,
		isDisabled && styles.disabled,
		style,
	];

	if (variant === 'primary') {
		return (
			<Pressable
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				disabled={isDisabled}
			>
				<Animated.View
					style={[
						buttonStyle,
						styles.primary,
						{ transform: [{ scale: scaleAnim }] },
					]}
				>
					<LinearGradient
						colors={[theme.colors.accent, theme.colors.primary]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.gradient}
					>
						{renderContent()}
					</LinearGradient>
				</Animated.View>
			</Pressable>
		);
	}

	return (
		<Pressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			disabled={isDisabled}
		>
			<Animated.View
				style={[
					buttonStyle,
					variant === 'secondary' && styles.secondary,
					variant === 'outline' && styles.outline,
					variant === 'ghost' && styles.ghost,
					{ transform: [{ scale: scaleAnim }] },
				]}
			>
				{renderContent()}
			</Animated.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		borderRadius: 100,
		overflow: 'hidden',
		...theme.shadow.button,
	},
	buttonSmall: {
		paddingVertical: 12,
		paddingHorizontal: 20,
	},
	buttonMedium: {
		paddingVertical: 16,
		paddingHorizontal: 28,
	},
	buttonLarge: {
		paddingVertical: 20,
		paddingHorizontal: 36,
	},
	fullWidth: {
		width: '100%',
	},
	primary: {
		overflow: 'hidden',
		borderRadius: 100,
	},
	secondary: {
		backgroundColor: theme.colors.accentLight,
		borderRadius: 100,
	},
	outline: {
		backgroundColor: 'transparent',
		borderWidth: 2,
		borderColor: theme.colors.accent,
		borderRadius: 100,
	},
	ghost: {
		backgroundColor: 'transparent',
		borderRadius: 100,
	},
	disabled: {
		opacity: 0.5,
	},
	gradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 28,
		borderRadius: 100,
	},
	text: {
		fontWeight: '700',
		textAlign: 'center',
		color: '#fff',
	},
	textSmall: {
		fontSize: 14,
	},
	textMedium: {
		fontSize: 16,
	},
	textLarge: {
		fontSize: 18,
	},
	textOutline: {
		color: theme.colors.accent,
	},
	textGhost: {
		color: theme.colors.accent,
	},
	textSecondary: {
		color: theme.colors.accent,
	},
	textDisabled: {
		color: theme.colors.subtextLight,
	},
	iconLeft: {
		marginRight: 8,
	},
	iconRight: {
		marginLeft: 8,
	},
});

