import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { updateMe } from '../../api/users';
import { User } from '../../types';

type EditProfileScreenProps = {
	navigation: any;
};

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
	const { user, setUser } = useAuth();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	// Estados para os campos do formulário
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [country, setCountry] = useState('');
	const [state, setState] = useState('');
	const [city, setCity] = useState('');
	const [street, setStreet] = useState('');
	const [number, setNumber] = useState('');
	const [reference, setReference] = useState('');

	// Carregar dados do usuário
	useEffect(() => {
		if (user) {
			setName(user.name || '');
			setPhone(user.phone || '');
			setCountry(user.country || 'Moçambique');
			setState(user.state || '');
			setCity(user.city || '');
			setStreet(user.street || '');
			setNumber(user.number || '');
			setReference(user.reference || '');
		}
	}, [user]);

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert('❌ Erro', 'O nome é obrigatório');
			return;
		}

		if (name.trim().length < 2) {
			Alert.alert('❌ Erro', 'O nome deve ter pelo menos 2 caracteres');
			return;
		}

		try {
			setSaving(true);

			const updateData: Partial<User> = {
				name: name.trim(),
				phone: phone.trim() || undefined,
				country: country.trim() || undefined,
				state: state.trim() || undefined,
				city: city.trim() || undefined,
				street: street.trim() || undefined,
				number: number.trim() || undefined,
				reference: reference.trim() || undefined,
			};

			const updatedUser = await updateMe(updateData);
			setUser(updatedUser);

			Alert.alert('✅ Sucesso', 'Perfil atualizado com sucesso!', [
				{
					text: 'OK',
					onPress: () => navigation.goBack(),
				},
			]);
		} catch (error: any) {
			console.error('Erro ao atualizar perfil:', error);
			Alert.alert('❌ Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
				<ActivityIndicator size="large" color={theme.colors.accent} />
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			{/* Header */}
			<View
				style={{
					paddingTop: 50,
					paddingHorizontal: theme.spacing(2),
					paddingBottom: theme.spacing(2),
					backgroundColor: 'white',
					...theme.shadow.card,
				}}
			>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
					<Pressable
						onPress={() => navigation.goBack()}
						style={{
							width: 40,
							height: 40,
							borderRadius: theme.radii.full,
							backgroundColor: theme.colors.neutralSoft,
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<Ionicons name="arrow-back" size={20} color={theme.colors.text} />
					</Pressable>
					<View style={{ flex: 1 }}>
						<Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '700' }]}>Editar Perfil</Text>
						<Text style={[theme.font.body, { color: theme.colors.subtext, marginTop: 2 }]}>
							Atualize suas informações
						</Text>
					</View>
					<View
						style={{
							backgroundColor: theme.colors.accentSoft,
							borderRadius: theme.radii.full,
							padding: theme.spacing(1.5),
						}}
					>
						<Ionicons name="person-circle" size={24} color={theme.colors.accent} />
					</View>
				</View>
			</View>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: theme.spacing(4) }}
				showsVerticalScrollIndicator={false}
			>
				{/* Informações Pessoais */}
				<View
					style={{
						backgroundColor: 'white',
						borderRadius: 20,
						padding: theme.spacing(2.5),
						marginBottom: theme.spacing(2),
						...theme.shadow.card,
					}}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), marginBottom: theme.spacing(2) }}>
						<Ionicons name="person" size={20} color={theme.colors.accent} />
						<Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '700' }]}>
							Informações Pessoais
						</Text>
					</View>

					{/* Nome */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Nome Completo *
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="person-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={name}
								onChangeText={setName}
								placeholder="Seu nome completo"
								placeholderTextColor={theme.colors.subtext}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* Email (readonly) */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Email
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
							opacity: 0.6,
						}}>
							<Ionicons name="mail-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={user?.email || ''}
								editable={false}
								placeholderTextColor={theme.colors.subtext}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.subtext,
									},
								]}
							/>
							<Ionicons name="lock-closed" size={16} color={theme.colors.subtext} />
						</View>
						<Text style={[theme.font.labelSmall, { color: theme.colors.subtext, marginTop: theme.spacing(0.5) }]}>
							O email não pode ser alterado
						</Text>
					</View>

					{/* Telefone */}
					<View>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Telefone
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="call-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={phone}
								onChangeText={setPhone}
								placeholder="+258 84 123 4567"
								placeholderTextColor={theme.colors.subtext}
								keyboardType="phone-pad"
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>
				</View>

				{/* Endereço */}
				<View
					style={{
						backgroundColor: 'white',
						borderRadius: 20,
						padding: theme.spacing(2.5),
						marginBottom: theme.spacing(2),
						...theme.shadow.card,
					}}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), marginBottom: theme.spacing(2) }}>
						<Ionicons name="location" size={20} color={theme.colors.accent} />
						<Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '700' }]}>Endereço</Text>
					</View>

					{/* País */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							País
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="flag-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={country}
								onChangeText={setCountry}
								placeholder="Moçambique"
								placeholderTextColor={theme.colors.subtext}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* Província/Estado */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Província
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="map-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={state}
								onChangeText={setState}
								placeholder="Maputo"
								placeholderTextColor={theme.colors.subtext}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* Cidade */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Cidade
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="business-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={city}
								onChangeText={setCity}
								placeholder="Maputo"
								placeholderTextColor={theme.colors.subtext}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* Rua */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Rua
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="home-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={street}
								onChangeText={setStreet}
								placeholder="Av. Julius Nyerere"
								placeholderTextColor={theme.colors.subtext}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* Número */}
					<View style={{ marginBottom: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Número
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="keypad-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={number}
								onChangeText={setNumber}
								placeholder="123"
								placeholderTextColor={theme.colors.subtext}
								keyboardType="numeric"
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
									},
								]}
							/>
						</View>
					</View>

					{/* Referência */}
					<View>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5), fontWeight: '600' }]}>
							Ponto de Referência
						</Text>
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: 16,
							paddingHorizontal: theme.spacing(1.5),
							borderWidth: 2,
							borderColor: theme.colors.border,
						}}>
							<Ionicons name="navigate-outline" size={20} color={theme.colors.subtext} />
							<TextInput
								value={reference}
								onChangeText={setReference}
								placeholder="Próximo ao mercado..."
								placeholderTextColor={theme.colors.subtext}
								multiline
								numberOfLines={2}
								style={[
									theme.font.body,
									{
										flex: 1,
										paddingVertical: theme.spacing(1.5),
										paddingHorizontal: theme.spacing(1),
										color: theme.colors.text,
										minHeight: 60,
										textAlignVertical: 'top',
									},
								]}
							/>
						</View>
					</View>
				</View>

				{/* Botão Salvar */}
				<Pressable
					onPress={handleSave}
					disabled={saving}
					style={{
						backgroundColor: saving ? theme.colors.subtext : theme.colors.accent,
						borderRadius: 20,
						paddingVertical: theme.spacing(2),
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: theme.spacing(1.5),
						...theme.shadow.button,
					}}
				>
					{saving ? (
						<ActivityIndicator size="small" color="white" />
					) : (
						<Ionicons name="checkmark-circle" size={24} color="white" />
					)}
					<Text style={[theme.font.h4, { color: 'white', fontWeight: '700' }]}>
						{saving ? 'Salvando...' : 'Salvar Alterações'}
					</Text>
				</Pressable>

				{/* Info */}
				<View
					style={{
						marginTop: theme.spacing(3),
						backgroundColor: theme.colors.infoSoft,
						borderRadius: 16,
						padding: theme.spacing(2),
						flexDirection: 'row',
						gap: theme.spacing(1.5),
					}}
				>
					<Ionicons name="information-circle" size={20} color={theme.colors.info} />
					<View style={{ flex: 1 }}>
						<Text style={[theme.font.labelSmall, { color: theme.colors.info, lineHeight: 18 }]}>
							Suas informações são privadas e seguras. O endereço será usado para entregas futuras.
						</Text>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}



