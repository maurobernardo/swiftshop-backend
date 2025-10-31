import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface AnimatedCardProps {
	children: React.ReactNode;
	delay?: number;
	onPress?: () => void;
	style?: ViewStyle;
	enableHover?: boolean;
}

export default function AnimatedCard({
	children,
	delay = 0,
	onPress,
	style,
	enableHover = true,
}: AnimatedCardProps) {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const hoverScale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				delay,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 50,
				friction: 7,
				delay,
				useNativeDriver: true,
			}),
		]).start();
	}, [delay]);

	const handlePressIn = () => {
		if (enableHover) {
			Animated.spring(hoverScale, {
				toValue: 0.98,
				tension: 300,
				friction: 10,
				useNativeDriver: true,
			}).start();
		}
	};

	const handlePressOut = () => {
		if (enableHover) {
			Animated.spring(hoverScale, {
				toValue: 1,
				tension: 300,
				friction: 10,
				useNativeDriver: true,
			}).start();
		}
	};

	const cardContent = (
		<Animated.View
			style={[
				styles.card,
				style,
				{
					opacity: fadeAnim,
					transform: [{ scale: Animated.multiply(scaleAnim, hoverScale) }],
				},
			]}
		>
			{children}
		</Animated.View>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
			>
				{cardContent}
			</Pressable>
		);
	}

	return cardContent;
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: theme.colors.card,
		borderRadius: 24,
		padding: theme.layout.cardPadding,
		...theme.shadow.card,
	},
});

