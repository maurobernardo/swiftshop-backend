import React, { useState, useEffect, useRef } from 'react';
import { Alert, Text, View, Pressable, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import biometricAuthService from '../../services/biometricAuth';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedInput from '../../components/AnimatedInput';
import AnimatedButton from '../../components/AnimatedButton';
import AnimatedCard from '../../components/AnimatedCard';

export default function LoginScreen({ navigation }: any) {
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [biometricAvailable, setBiometricAvailable] = useState(false);
	const [biometricEnabled, setBiometricEnabled] = useState(false);
	const [biometricType, setBiometricType] = useState<string>('');
	const [biometricLoading, setBiometricLoading] = useState(false);
	
	// Animações
	const logoScale = useRef(new Animated.Value(0)).current;
	const logoPulse = useRef(new Animated.Value(1)).current;

	// Verificar disponibilidade biométrica ao carregar a tela
	useEffect(() => {
		checkBiometricAvailability();
		
		// Animação do logo
		Animated.spring(logoScale, {
			toValue: 1,
			tension: 40,
			friction: 6,
			useNativeDriver: true,
		}).start();

		// Pulse contínuo do logo
		Animated.loop(
			Animated.sequence([
				Animated.timing(logoPulse, {
					toValue: 1.05,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(logoPulse, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);

	const checkBiometricAvailability = async () => {
		try {
			const capabilities = await biometricAuthService.checkCapabilities();
			const isEnabled = await biometricAuthService.isBiometricEnabled();
			
			setBiometricAvailable(capabilities.isAvailable && capabilities.isEnrolled);
			setBiometricEnabled(isEnabled);
			
			if (capabilities.biometryType) {
				setBiometricType(biometricAuthService.getBiometryTypeName(capabilities.biometryType));
			}
		} catch (error) {
			console.error('Erro ao verificar biometria:', error);
		}
	};

	const onSubmit = async () => {
		if (!email || !password) {
			Alert.alert('Campos obrigatórios', 'Preencha email e senha.');
			return;
		}
		setLoading(true);
		try {
			await login(email.trim(), password);
			
			// Se biometria está disponível mas não habilitada, perguntar se quer habilitar
			if (biometricAvailable && !biometricEnabled) {
				Alert.alert(
					'Habilitar Autenticação Biométrica',
					`Deseja habilitar ${biometricType} para fazer login mais rapidamente?`,
					[
						{
							text: 'Agora não',
							style: 'cancel',
						},
						{
							text: 'Habilitar',
							onPress: async () => {
								await biometricAuthService.setupBiometricAfterLogin(email.trim(), password);
								setBiometricEnabled(true);
							},
						},
					]
				);
			}
		} catch (e: any) {
			Alert.alert('Erro de login', e?.response?.data?.detail || 'Não foi possível autenticar');
		} finally {
			setLoading(false);
		}
	};

	const onBiometricLogin = async () => {
		setBiometricLoading(true);
		try {
			const result = await biometricAuthService.loginWithBiometric();
			
			if (result.success && result.email && result.password) {
				await login(result.email, result.password);
			} else {
				Alert.alert('Erro na autenticação biométrica', result.error || 'Falha na autenticação');
			}
		} catch (error: any) {
			Alert.alert('Erro', 'Erro interno na autenticação biométrica');
		} finally {
			setBiometricLoading(false);
		}
	};

	return (
		<AnimatedScreen scrollable keyboardAvoiding>
			<View style={styles.container}>
				{/* Header with Animated Logo */}
				<View style={styles.header}>
					<Animated.View
						style={[
							styles.logoContainer,
							{
								transform: [
									{ scale: Animated.multiply(logoScale, logoPulse) },
								],
							},
						]}
					>
						<LinearGradient
							colors={[theme.colors.accent, theme.colors.primary]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.logoGradient}
						>
							<Ionicons name="cart" size={40} color="#fff" />
						</LinearGradient>
					</Animated.View>
					<Text style={styles.title}>Bem-vindo de volta!</Text>
					<Text style={styles.subtitle}>Entre na sua conta para continuar</Text>
				</View>

				{/* Form Card */}
				<AnimatedCard style={styles.formCard} delay={200}>
					<AnimatedInput
						label="Email"
						value={email}
						onChangeText={setEmail}
						icon="mail"
						keyboardType="email-address"
						autoCapitalize="none"
						placeholder="seu@email.com"
					/>

					<AnimatedInput
						label="Senha"
						value={password}
						onChangeText={setPassword}
						icon="lock-closed"
						secureTextEntry={!showPassword}
						placeholder="Sua senha"
						rightIcon={showPassword ? 'eye-off' : 'eye'}
						onRightIconPress={() => setShowPassword(!showPassword)}
					/>

					<View style={styles.buttonContainer}>
						<AnimatedButton
							title={loading ? 'Entrando...' : 'Entrar'}
							onPress={onSubmit}
							loading={loading}
							disabled={loading}
							fullWidth
							icon="log-in"
							iconPosition="right"
						/>
					</View>

					{/* Biometric Login */}
					{biometricAvailable && biometricEnabled && (
						<>
							<View style={styles.divider}>
								<View style={styles.dividerLine} />
								<Text style={styles.dividerText}>ou</Text>
								<View style={styles.dividerLine} />
							</View>

							<AnimatedButton
								title={biometricLoading ? 'Autenticando...' : `Entrar com ${biometricType}`}
								onPress={onBiometricLogin}
								loading={biometricLoading}
								disabled={biometricLoading}
								fullWidth
								variant="outline"
								icon={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
							/>
						</>
					)}
				</AnimatedCard>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Não tem conta?{' '}
						<Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
							Criar conta
						</Text>
					</Text>
				</View>
			</View>
		</AnimatedScreen>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: theme.spacing(4),
	},
	header: {
		alignItems: 'center',
		marginBottom: theme.spacing(4),
	},
	logoContainer: {
		marginBottom: theme.spacing(3),
	},
	logoGradient: {
		width: 100,
		height: 100,
		borderRadius: 50,
		alignItems: 'center',
		justifyContent: 'center',
		...theme.shadow.card,
	},
	title: {
		...theme.font.h2,
		color: theme.colors.text,
		marginBottom: theme.spacing(1),
	},
	subtitle: {
		...theme.font.body,
		color: theme.colors.subtext,
		textAlign: 'center',
	},
	formCard: {
		padding: theme.spacing(3),
		marginBottom: theme.spacing(3),
	},
	buttonContainer: {
		marginTop: theme.spacing(2),
	},
	divider: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: theme.spacing(3),
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: theme.colors.borderLight,
	},
	dividerText: {
		...theme.font.labelSmall,
		color: theme.colors.subtext,
		marginHorizontal: theme.spacing(2),
	},
	footer: {
		alignItems: 'center',
		marginTop: theme.spacing(2),
	},
	footerText: {
		...theme.font.body,
		color: theme.colors.subtext,
	},
	footerLink: {
		...theme.font.label,
		color: theme.colors.accent,
		fontWeight: '700',
	},
});
