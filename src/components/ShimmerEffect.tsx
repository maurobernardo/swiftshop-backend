import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerEffectProps {
	width?: number | string;
	height?: number | string;
	borderRadius?: number;
	shimmerColors?: string[];
	duration?: number;
}

export default function ShimmerEffect({
	width = '100%',
	height = 100,
	borderRadius = 10,
	shimmerColors = [
		'rgba(255, 255, 255, 0.0)',
		'rgba(255, 255, 255, 0.3)',
		'rgba(255, 255, 255, 0.0)',
	],
	duration = 2000,
}: ShimmerEffectProps) {
	const animatedValue = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.loop(
			Animated.timing(animatedValue, {
				toValue: 1,
				duration: duration,
				useNativeDriver: true,
			})
		).start();
	}, [duration]);

	const translateX = animatedValue.interpolate({
		inputRange: [0, 1],
		outputRange: [-350, 350],
	});

	return (
		<View
			style={[
				styles.container,
				{
					width,
					height,
					borderRadius,
				},
			]}
		>
			<Animated.View
				style={[
					styles.shimmer,
					{
						transform: [{ translateX }],
					},
				]}
			>
				<LinearGradient
					colors={shimmerColors}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={styles.gradient}
				/>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	shimmer: {
		width: '100%',
		height: '100%',
	},
	gradient: {
		flex: 1,
		width: 350,
	},
});

