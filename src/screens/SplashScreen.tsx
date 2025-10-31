import React, { useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Dimensions,
	StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
	onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
	// Animações
	const logoScale = useRef(new Animated.Value(0)).current;
	const logoRotate = useRef(new Animated.Value(0)).current;
	const titleOpacity = useRef(new Animated.Value(0)).current;
	const loadingOpacity = useRef(new Animated.Value(0)).current;
	const dotAnimation1 = useRef(new Animated.Value(0)).current;
	const dotAnimation2 = useRef(new Animated.Value(0)).current;
	const dotAnimation3 = useRef(new Animated.Value(0)).current;
	const progressWidth = useRef(new Animated.Value(0)).current;
	const glowPulse = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		// Sequência de animações
		Animated.sequence([
			// 1. Logo aparece e gira
			Animated.parallel([
				Animated.spring(logoScale, {
					toValue: 1,
					tension: 40,
					friction: 5,
					useNativeDriver: true,
				}),
				Animated.timing(logoRotate, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			]),
			// 2. Título aparece
			Animated.timing(titleOpacity, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
			}),
			// 3. Texto "Carregando" aparece
			Animated.timing(loadingOpacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();

		// Animação de pulso do brilho (loop)
		Animated.loop(
			Animated.sequence([
				Animated.timing(glowPulse, {
					toValue: 1.3,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(glowPulse, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			])
		).start();

		// Animação dos dots de loading (loop)
		const animateDots = () => {
			Animated.loop(
				Animated.stagger(200, [
					Animated.sequence([
						Animated.timing(dotAnimation1, {
							toValue: 1,
							duration: 400,
							useNativeDriver: true,
						}),
						Animated.timing(dotAnimation1, {
							toValue: 0,
							duration: 400,
							useNativeDriver: true,
						}),
					]),
					Animated.sequence([
						Animated.timing(dotAnimation2, {
							toValue: 1,
							duration: 400,
							useNativeDriver: true,
						}),
						Animated.timing(dotAnimation2, {
							toValue: 0,
							duration: 400,
							useNativeDriver: true,
						}),
					]),
					Animated.sequence([
						Animated.timing(dotAnimation3, {
							toValue: 1,
							duration: 400,
							useNativeDriver: true,
						}),
						Animated.timing(dotAnimation3, {
							toValue: 0,
							duration: 400,
							useNativeDriver: true,
						}),
					]),
				])
			).start();
		};

		// Inicia animação dos dots após 1.5s
		setTimeout(animateDots, 1500);

		// Barra de progresso
		Animated.timing(progressWidth, {
			toValue: width * 0.8,
			duration: 2500,
			useNativeDriver: false,
		}).start();

		// Finaliza após 3 segundos
		const timer = setTimeout(() => {
			onFinish();
		}, 3000);

		return () => clearTimeout(timer);
	}, []);

	const rotateInterpolate = logoRotate.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	const dot1Scale = dotAnimation1.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 1.5],
	});

	const dot2Scale = dotAnimation2.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 1.5],
	});

	const dot3Scale = dotAnimation3.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 1.5],
	});

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor={theme.colors.accent} />
			
			{/* Background Gradient */}
			<LinearGradient
				colors={[theme.colors.accent, theme.colors.primary]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFillObject}
			/>

			{/* Conteúdo Central */}
			<View style={styles.content}>
				{/* Logo com Brilho */}
				<Animated.View
					style={[
						styles.logoContainer,
						{
							transform: [
								{ scale: logoScale },
								{ rotate: rotateInterpolate },
							],
						},
					]}
				>
					{/* Glow/Brilho */}
					<Animated.View
						style={[
							styles.logoGlow,
							{
								transform: [{ scale: glowPulse }],
								opacity: glowPulse.interpolate({
									inputRange: [1, 1.3],
									outputRange: [0.3, 0.6],
								}),
							},
						]}
					/>
					
					{/* Logo Circle */}
					<View style={styles.logoCircle}>
						<Ionicons name="cart" size={80} color="#fff" />
					</View>
				</Animated.View>

				{/* Título */}
				<Animated.Text
					style={[
						styles.title,
						{ opacity: titleOpacity },
					]}
				>
					SwiftShop
				</Animated.Text>

				{/* Texto "Carregando" */}
				<Animated.View
					style={[
						styles.loadingContainer,
						{ opacity: loadingOpacity },
					]}
				>
					<Text style={styles.loadingText}>Carregando</Text>
					<View style={styles.dotsContainer}>
						<Animated.View
							style={[
								styles.dot,
								{
									transform: [{ scale: dot1Scale }],
									opacity: dotAnimation1,
								},
							]}
						/>
						<Animated.View
							style={[
								styles.dot,
								{
									transform: [{ scale: dot2Scale }],
									opacity: dotAnimation2,
								},
							]}
						/>
						<Animated.View
							style={[
								styles.dot,
								{
									transform: [{ scale: dot3Scale }],
									opacity: dotAnimation3,
								},
							]}
						/>
					</View>
				</Animated.View>

				{/* Barra de Progresso */}
				<View style={styles.progressBarContainer}>
					<View style={styles.progressBarBackground}>
						<Animated.View
							style={[
								styles.progressBarFill,
								{ width: progressWidth },
							]}
						/>
					</View>
				</View>
			</View>

			{/* Versão no rodapé */}
			<Animated.View
				style={[
					styles.footer,
					{ opacity: loadingOpacity },
				]}
			>
				<Text style={styles.version}>Versão 1.0.0</Text>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.accent,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: theme.layout.containerPadding,
	},
	logoContainer: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 40,
	},
	logoGlow: {
		position: 'absolute',
		width: 200,
		height: 200,
		borderRadius: 100,
		backgroundColor: theme.colors.accentSoft,
		opacity: 0.4,
	},
	logoCircle: {
		width: 160,
		height: 160,
		borderRadius: 80,
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 4,
		borderColor: 'rgba(255, 255, 255, 0.3)',
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.5,
		shadowRadius: 20,
		elevation: 10,
	},
	title: {
		fontSize: 48,
		fontWeight: '900',
		color: '#fff',
		marginBottom: 60,
		letterSpacing: -1,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 8,
	},
	loadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 40,
	},
	loadingText: {
		fontSize: 18,
		color: 'rgba(255, 255, 255, 0.9)',
		fontWeight: '600',
		marginRight: 8,
	},
	dotsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#fff',
	},
	progressBarContainer: {
		width: '80%',
		alignItems: 'center',
	},
	progressBarBackground: {
		width: '100%',
		height: 4,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#fff',
		borderRadius: 2,
	},
	footer: {
		position: 'absolute',
		bottom: 40,
		alignSelf: 'center',
	},
	version: {
		fontSize: 12,
		color: 'rgba(255, 255, 255, 0.6)',
		fontWeight: '500',
	},
});

