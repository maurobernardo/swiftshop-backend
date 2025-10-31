import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Dimensions,
	Pressable,
	StatusBar,
	ScrollView,
	Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import FloatingParticles from '../components/FloatingParticles';

const { width, height } = Dimensions.get('window');

const features = [
	{ icon: 'flash' as const, title: 'Entrega Rápida' },
	{ icon: 'shield-checkmark' as const, title: 'Seguro' },
	{ icon: 'sparkles' as const, title: 'Premium' },
	{ icon: 'gift' as const, title: 'Ofertas' },
];

interface WelcomeScreenProps {
	navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
	// Animações
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const logoScale = useRef(new Animated.Value(0.5)).current;
	const logoRotate = useRef(new Animated.Value(0)).current;
	const buttonScale = useRef(new Animated.Value(0.9)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		// Animação inicial
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.spring(slideAnim, {
				toValue: 0,
				tension: 50,
				friction: 7,
				useNativeDriver: true,
			}),
			Animated.spring(logoScale, {
				toValue: 1,
				tension: 40,
				friction: 6,
				useNativeDriver: true,
			}),
			Animated.timing(logoRotate, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
			}),
			Animated.spring(buttonScale, {
				toValue: 1,
				tension: 50,
				friction: 7,
				delay: 500,
				useNativeDriver: true,
			}),
		]).start();

		// Animação de pulso contínua
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.1,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);


	const rotateInterpolate = logoRotate.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />
			
			{/* Background Gradient Animado - Usando cores do sistema */}
			<LinearGradient
				colors={[theme.colors.accent, theme.colors.primary, theme.colors.accent]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFillObject}
			>
				{/* Círculos Decorativos */}
				<View style={styles.circleDecoration1} />
				<View style={styles.circleDecoration2} />
				<View style={styles.circleDecoration3} />
				
				{/* Partículas Flutuantes Animadas */}
				<FloatingParticles count={15} />
			</LinearGradient>

			<ScrollView 
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Logo e Título Animado */}
				<Animated.View
					style={[
						styles.logoContainer,
						{
							opacity: fadeAnim,
							transform: [
								{ scale: logoScale },
								{ rotate: rotateInterpolate },
								{ translateY: slideAnim },
							],
						},
					]}
				>
					<View style={styles.logoCircle}>
						<Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
							<Ionicons name="cart" size={60} color="#fff" />
						</Animated.View>
					</View>
					
					<Animated.Text
						style={[
							styles.title,
							{
								opacity: fadeAnim,
								transform: [{ translateY: slideAnim }],
							},
						]}
					>
						SwiftShop
					</Animated.Text>
					
					<Animated.Text
						style={[
							styles.subtitle,
							{
								opacity: fadeAnim,
								transform: [{ translateY: slideAnim }],
							},
						]}
					>
						Sua loja online favorita
					</Animated.Text>
				</Animated.View>

				{/* Features Minimalistas em Grid */}
				<Animated.View
					style={[
						styles.featuresSection,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					{features.map((feature, index) => (
						<Animated.View
							key={index}
							style={[
								styles.miniFeatureCard,
								{
									opacity: fadeAnim,
									transform: [
										{
											translateY: slideAnim.interpolate({
												inputRange: [0, 50],
												outputRange: [0, 50 + index * 5],
											}),
										},
									],
								},
							]}
						>
							<View style={styles.miniIconCircle}>
								<Ionicons name={feature.icon} size={24} color="#fff" />
							</View>
							<Text style={styles.miniFeatureTitle}>{feature.title}</Text>
						</Animated.View>
					))}
				</Animated.View>

				{/* Botões Animados */}
				<Animated.View
					style={[
						styles.buttonsContainer,
						{
							opacity: fadeAnim,
							transform: [{ scale: buttonScale }, { translateY: slideAnim }],
						},
					]}
				>
					<Pressable
						onPress={() => navigation.navigate('Register')}
						style={({ pressed }) => [
							styles.primaryButton,
							pressed && styles.buttonPressed,
						]}
					>
						{({ pressed }) => (
							<>
								<LinearGradient
									colors={['#fff', '#f8f9fa']}
									style={styles.buttonGradient}
								>
									<Text style={styles.primaryButtonText}>Criar Conta</Text>
									<Ionicons name="arrow-forward" size={20} color="#7C3AED" />
								</LinearGradient>
							</>
						)}
					</Pressable>

					<Pressable
						onPress={() => navigation.navigate('Login')}
						style={({ pressed }) => [
							styles.secondaryButton,
							pressed && styles.buttonPressed,
						]}
					>
						<Text style={styles.secondaryButtonText}>Já tenho conta</Text>
					</Pressable>
				</Animated.View>

				{/* Estatísticas Simples */}
				<Animated.View
					style={[
						styles.statsRow,
						{
							opacity: fadeAnim,
						},
					]}
				>
					{[
						{ icon: 'star', label: '4.9★', desc: 'Avaliação' },
						{ icon: 'people', label: '10k+', desc: 'Clientes' },
						{ icon: 'cube', label: '5k+', desc: 'Produtos' },
					].map((item, index) => (
						<View key={index} style={styles.statItem}>
							<Ionicons name={item.icon as any} size={18} color="rgba(255,255,255,0.8)" />
							<Text style={styles.statLabel}>{item.label}</Text>
							<Text style={styles.statDesc}>{item.desc}</Text>
						</View>
					))}
				</Animated.View>

				{/* Footer */}
				<Animated.View
					style={[
						styles.footer,
						{
							opacity: fadeAnim,
						},
					]}
				>
					<Text style={styles.footerText}>
						Ao continuar, você concorda com nossos
					</Text>
					<Text style={styles.footerLink}>
						Termos de Serviço e Política de Privacidade
					</Text>
				</Animated.View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.accent,
	},
	scrollContent: {
		flexGrow: 1,
		padding: theme.layout.containerPadding,
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingBottom: 40,
	},
	circleDecoration1: {
		position: 'absolute',
		width: 300,
		height: 300,
		borderRadius: 150,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		top: -100,
		right: -100,
	},
	circleDecoration2: {
		position: 'absolute',
		width: 200,
		height: 200,
		borderRadius: 100,
		backgroundColor: 'rgba(255, 255, 255, 0.03)',
		bottom: 100,
		left: -50,
	},
	circleDecoration3: {
		position: 'absolute',
		width: 150,
		height: 150,
		borderRadius: 75,
		backgroundColor: 'rgba(255, 255, 255, 0.04)',
		top: height / 2,
		right: -30,
	},
	logoContainer: {
		alignItems: 'center',
		marginTop: 20,
		marginBottom: 40,
	},
	logoCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		borderWidth: 3,
		borderColor: 'rgba(255, 255, 255, 0.3)',
	},
	title: {
		fontSize: 48,
		fontWeight: '900',
		color: '#fff',
		marginBottom: 8,
		textAlign: 'center',
		letterSpacing: -1,
		textShadowColor: 'rgba(0, 0, 0, 0.2)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 8,
	},
	subtitle: {
		fontSize: 18,
		color: 'rgba(255, 255, 255, 0.9)',
		textAlign: 'center',
		fontWeight: '500',
	},
	featuresSection: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 40,
		paddingHorizontal: 8,
		gap: 16,
	},
	miniFeatureCard: {
		width: (width - 80) / 2,
		backgroundColor: 'rgba(255, 255, 255, 0.12)',
		borderRadius: 20,
		padding: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
		minHeight: 120,
	},
	miniIconCircle: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	miniFeatureTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: '#fff',
		textAlign: 'center',
		opacity: 0.95,
	},
	dotsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
		gap: 8,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: 'rgba(255, 255, 255, 0.3)',
	},
	activeDot: {
		width: 24,
		backgroundColor: '#fff',
	},
	buttonsContainer: {
		gap: 16,
		marginBottom: 32,
	},
	primaryButton: {
		borderRadius: theme.radii.lg,
		overflow: 'hidden',
		...theme.shadow.button,
	},
	buttonGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 18,
		paddingHorizontal: 32,
		gap: 8,
	},
	primaryButtonText: {
		fontSize: 18,
		fontWeight: '700',
		color: theme.colors.accent,
	},
	secondaryButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: theme.radii.lg,
		paddingVertical: 18,
		paddingHorizontal: 32,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.3)',
	},
	secondaryButtonText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
	},
	buttonPressed: {
		opacity: 0.7,
		transform: [{ scale: 0.98 }],
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 24,
		paddingHorizontal: 20,
	},
	statItem: {
		alignItems: 'center',
		gap: 4,
	},
	statLabel: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
		marginTop: 4,
	},
	statDesc: {
		color: 'rgba(255, 255, 255, 0.7)',
		fontSize: 11,
		fontWeight: '500',
	},
	footer: {
		alignItems: 'center',
		marginTop: 'auto',
		paddingTop: 20,
	},
	footerText: {
		color: 'rgba(255, 255, 255, 0.7)',
		fontSize: 12,
		textAlign: 'center',
		marginBottom: 4,
	},
	footerLink: {
		color: 'rgba(255, 255, 255, 0.9)',
		fontSize: 12,
		fontWeight: '600',
		textAlign: 'center',
		textDecorationLine: 'underline',
	},
});

