import React, { useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	Animated,
	ViewStyle,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { theme } from '../theme';

interface AnimatedScreenProps {
	children: React.ReactNode;
	style?: ViewStyle;
	scrollable?: boolean;
	showsVerticalScrollIndicator?: boolean;
	contentContainerStyle?: ViewStyle;
	keyboardAvoiding?: boolean;
}

export default function AnimatedScreen({
	children,
	style,
	scrollable = false,
	showsVerticalScrollIndicator = false,
	contentContainerStyle,
	keyboardAvoiding = true,
}: AnimatedScreenProps) {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 8,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const animatedStyle = {
		opacity: fadeAnim,
		transform: [{ translateY: slideAnim }],
	};

	const content = (
		<Animated.View style={[styles.container, animatedStyle, style]}>
			{children}
		</Animated.View>
	);

	if (scrollable) {
		const scrollContent = (
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
				showsVerticalScrollIndicator={showsVerticalScrollIndicator}
			>
				<Animated.View style={animatedStyle}>{children}</Animated.View>
			</ScrollView>
		);

		if (keyboardAvoiding && Platform.OS === 'ios') {
			return (
				<KeyboardAvoidingView style={styles.flex} behavior="padding">
					{scrollContent}
				</KeyboardAvoidingView>
			);
		}

		return scrollContent;
	}

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scroll: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollContent: {
		flexGrow: 1,
		padding: theme.layout.containerPadding,
	},
	flex: {
		flex: 1,
	},
});

