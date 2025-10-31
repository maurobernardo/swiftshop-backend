import React, { useState, useRef, useEffect } from 'react';
import { Alert, Text, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedCard from '../../components/AnimatedCard';
import AnimatedInput from '../../components/AnimatedInput';
import AnimatedButton from '../../components/AnimatedButton';

export default function RegisterScreen({ navigation }: any) {
	const { register } = useAuth();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [phone, setPhone] = useState('');
	const [country, setCountry] = useState('');
	const [stateProv, setStateProv] = useState('');
	const [city, setCity] = useState('');
	const [street, setStreet] = useState('');
	const [number, setNumber] = useState('');
	const [reference, setReference] = useState('');
	const [loading, setLoading] = useState(false);

	// Animações
	const logoScale = useRef(new Animated.Value(0)).current;
	const logoPulse = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		// Animação do logo
		Animated.spring(logoScale, {
			toValue: 1,
			tension: 40,
			friction: 6,
			useNativeDriver: true,
		}).start();

		// Pulse contínuo
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

	const onSubmit = async () => {
		if (!name || !email || !password || !phone || !country || !stateProv || !city || !street || !number) {
			Alert.alert(
				'Campos obrigatórios',
				'Preencha todos os campos: nome, email, senha, telefone, país, província/estado, cidade, rua/avenida e número.'
			);
			return;
		}

		// Password strength validation
		const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
		if (!strongPassword.test(password)) {
			Alert.alert(
				'Senha fraca',
				'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.'
			);
			return;
		}
		setLoading(true);
		try {
			await register(name.trim(), email.trim(), password, 'client', {
				phone: phone.trim(),
				country: country.trim(),
				state: stateProv.trim(),
				city: city.trim(),
				street: street.trim(),
				number: number.trim(),
				reference: reference.trim(),
			});
			Alert.alert('Cadastro', 'Conta criada com sucesso!');
		} catch (e: any) {
			Alert.alert('Erro de cadastro', e?.response?.data?.detail || 'Não foi possível cadastrar');
		} finally {
			setLoading(false);
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
							<Ionicons name="person-add" size={40} color="#fff" />
						</LinearGradient>
					</Animated.View>
					<Text style={styles.title}>Criar conta</Text>
					<Text style={styles.subtitle}>Preencha os dados para começar</Text>
				</View>

				{/* Personal Information Card */}
				<AnimatedCard style={styles.card} delay={200}>
					<Text style={styles.cardTitle}>Informações pessoais</Text>
					
					<AnimatedInput
						label="Nome completo"
						value={name}
						onChangeText={setName}
						icon="person"
						placeholder="Seu nome completo"
					/>

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
						placeholder="Mínimo 8 caracteres"
						rightIcon={showPassword ? 'eye-off' : 'eye'}
						onRightIconPress={() => setShowPassword(!showPassword)}
					/>

					<AnimatedInput
						label="Telefone / WhatsApp"
						value={phone}
						onChangeText={setPhone}
						icon="call"
						keyboardType="phone-pad"
						placeholder="258 842767435"
					/>
				</AnimatedCard>

				{/* Address Information Card */}
				<AnimatedCard style={styles.card} delay={300}>
					<Text style={styles.cardTitle}>Endereço de entrega</Text>

					<View style={styles.row}>
						<View style={styles.halfInput}>
							<AnimatedInput
								label="País"
								value={country}
								onChangeText={setCountry}
								icon="globe"
								placeholder="Moçambique"
							/>
						</View>
						<View style={styles.halfInput}>
							<AnimatedInput
								label="Estado"
								value={stateProv}
								onChangeText={setStateProv}
								icon="map"
								placeholder="Sofala"
							/>
						</View>
					</View>

					<AnimatedInput
						label="Cidade"
						value={city}
						onChangeText={setCity}
						icon="location"
						placeholder="Beira"
					/>

					<AnimatedInput
						label="Rua / Avenida"
						value={street}
						onChangeText={setStreet}
						icon="trail-sign"
						placeholder="Av. Eduardo Mondlane"
					/>

					<View style={styles.row}>
						<View style={styles.thirdInput}>
							<AnimatedInput
								label="Número"
								value={number}
								onChangeText={setNumber}
								icon="home"
								keyboardType="number-pad"
								placeholder="123"
							/>
						</View>
						<View style={styles.twoThirdsInput}>
							<AnimatedInput
								label="Referência (opcional)"
								value={reference}
								onChangeText={setReference}
								icon="information-circle"
								placeholder="Próximo ao parque"
							/>
						</View>
					</View>
				</AnimatedCard>

				{/* Submit Button */}
				<View style={styles.buttonContainer}>
					<AnimatedButton
						title={loading ? 'Registrando...' : 'Criar conta'}
						onPress={onSubmit}
						loading={loading}
						disabled={loading}
						fullWidth
						icon="checkmark-circle"
						iconPosition="right"
					/>
				</View>

				{/* Footer - Link to Login */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Já tem conta?{' '}
						<Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
							Fazer login
						</Text>
					</Text>
				</View>
			</View>
		</AnimatedScreen>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: theme.spacing(2),
	},
	header: {
		alignItems: 'center',
		marginBottom: theme.spacing(3),
	},
	logoContainer: {
		marginBottom: theme.spacing(2),
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
		marginBottom: theme.spacing(0.5),
	},
	subtitle: {
		...theme.font.body,
		color: theme.colors.subtext,
		textAlign: 'center',
	},
	card: {
		padding: theme.spacing(3),
		marginBottom: theme.spacing(2),
	},
	cardTitle: {
		...theme.font.h4,
		color: theme.colors.text,
		marginBottom: theme.spacing(2),
	},
	row: {
		flexDirection: 'row',
		gap: theme.spacing(1),
	},
	halfInput: {
		flex: 1,
	},
	thirdInput: {
		flex: 1,
	},
	twoThirdsInput: {
		flex: 2,
	},
	buttonContainer: {
		marginTop: theme.spacing(2),
		marginBottom: theme.spacing(2),
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
