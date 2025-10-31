import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AnimatedButton from './AnimatedButton';

interface EmptyStateProps {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

export default function EmptyState({
	icon,
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.8)).current;
	const iconScale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 50,
				friction: 7,
				useNativeDriver: true,
			}),
		]).start();

		// Pulse do ícone
		Animated.loop(
			Animated.sequence([
				Animated.timing(iconScale, {
					toValue: 1.1,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(iconScale, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: fadeAnim,
					transform: [{ scale: scaleAnim }],
				},
			]}
		>
			<Animated.View
				style={[
					styles.iconContainer,
					{ transform: [{ scale: iconScale }] },
				]}
			>
				<Ionicons name={icon} size={80} color={theme.colors.accent} />
			</Animated.View>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.description}>{description}</Text>
			{actionLabel && onAction && (
				<View style={styles.actionContainer}>
					<AnimatedButton
						title={actionLabel}
						onPress={onAction}
						variant="primary"
						icon="add-circle"
					/>
				</View>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: theme.layout.containerPadding * 2,
	},
	iconContainer: {
		width: 140,
		height: 140,
		borderRadius: 70,
		backgroundColor: theme.colors.accentSoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
	},
	title: {
		...theme.font.h2,
		color: theme.colors.text,
		marginBottom: 12,
		textAlign: 'center',
	},
	description: {
		...theme.font.body,
		color: theme.colors.subtext,
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 22,
	},
	actionContainer: {
		marginTop: 16,
	},
});

