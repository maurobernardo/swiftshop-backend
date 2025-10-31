import React, { useState, useEffect } from 'react';
import { 
	View, 
	Text, 
	ScrollView, 
	Pressable, 
	Alert, 
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import Screen from '../../components/Screen';
import AnimatedButton from '../../components/AnimatedButton';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '../../api/uploads';
import { updateMe } from '../../api/users';

export default function ProfileScreen() {
	const { 
		name, 
		email, 
		phone, 
		country, 
		state, 
		city, 
		street, 
		number, 
		reference, 
		avatarUrl: ctxAvatar, 
		refreshMe 
	} = useAuth();
	
	const [formData, setFormData] = useState({
		name: name || '',
		email: email || '',
		phone: phone || '',
		country: country || '',
		state: state || '',
		city: city || '',
		street: street || '',
		number: number || '',
		reference: reference || '',
	});
	
	const [avatarUrl, setAvatarUrl] = useState<string | undefined>(ctxAvatar);
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		setAvatarUrl(ctxAvatar);
	}, [ctxAvatar]);

	const handleInputChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handlePickAvatar = async () => {
		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permissão necessária', 'Conceda acesso às fotos para alterar sua foto de perfil.');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				quality: 0.8,
				allowsEditing: true,
				aspect: [1, 1],
			});

			if (!result.canceled && result.assets?.length) {
				setUploading(true);
				const localUri = result.assets[0].uri;
				const remoteUrl = await uploadImageAsync(localUri);
				setAvatarUrl(remoteUrl);
				
				// Atualizar avatar no contexto
				try {
					await updateMe({ avatar_url: remoteUrl });
					await refreshMe();
				} catch (error) {
					console.error('Erro ao atualizar avatar:', error);
				}
				setUploading(false);
			}
		} catch (error) {
			setUploading(false);
			Alert.alert('Erro', 'Não foi possível alterar a foto de perfil.');
		}
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			Alert.alert('Erro', 'O nome é obrigatório.');
			return;
		}

		if (!formData.email.trim()) {
			Alert.alert('Erro', 'O email é obrigatório.');
			return;
		}

		setLoading(true);
		try {
			await updateMe(formData);
			await refreshMe();
			Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
		} catch (error: any) {
			Alert.alert('Erro', error?.response?.data?.detail || 'Não foi possível atualizar o perfil.');
		} finally {
			setLoading(false);
		}
	};

	const inputStyle = {
		borderWidth: 1,
		borderColor: theme.colors.borderLight,
		borderRadius: theme.radii.md,
		paddingHorizontal: theme.spacing(3),
		paddingVertical: theme.spacing(2.5),
		backgroundColor: 'white',
		color: theme.colors.text,
		fontSize: 16,
		...theme.shadow.card,
	};

	return (
		<Screen title="Editar Perfil" showBackButton>
			<KeyboardAvoidingView 
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView showsVerticalScrollIndicator={false}>
					{/* Avatar Section */}
					<View style={{
						alignItems: 'center',
						marginBottom: theme.spacing(6),
					}}>
						<Pressable onPress={handlePickAvatar} disabled={uploading}>
							<View style={{
								width: 120,
								height: 120,
								borderRadius: 60,
								backgroundColor: theme.colors.neutralSoft,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: 4,
								borderColor: theme.colors.accent,
								...theme.shadow.card,
								opacity: uploading ? 0.6 : 1,
							}}>
								{avatarUrl ? (
									<Image 
										source={{ uri: avatarUrl }} 
										style={{ 
											width: 112, 
											height: 112, 
											borderRadius: 56 
										}} 
										resizeMode="cover"
									/>
								) : (
									<Ionicons name="person" size={48} color={theme.colors.subtext} />
								)}
								{uploading && (
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										backgroundColor: 'rgba(0,0,0,0.5)',
										borderRadius: 56,
										alignItems: 'center',
										justifyContent: 'center',
									}}>
										<Ionicons name="cloud-upload" size={24} color="white" />
									</View>
								)}
							</View>
						</Pressable>
						<Text style={{
							...theme.font.label,
							color: theme.colors.subtext,
							marginTop: theme.spacing(2),
							textAlign: 'center',
						}}>
							{uploading ? 'Enviando...' : 'Toque para alterar a foto'}
						</Text>
					</View>

					{/* Form Section */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: theme.radii.xl,
						padding: theme.spacing(4),
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						<Text style={{
							...theme.font.h3,
							color: theme.colors.text,
							marginBottom: theme.spacing(4),
							textAlign: 'center',
							fontWeight: '700',
						}}>
							Informações Pessoais
						</Text>

						<View style={{ gap: theme.spacing(4) }}>
							{/* Name */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Nome Completo *
								</Text>
								<TextInput
									value={formData.name}
									onChangeText={(value) => handleInputChange('name', value)}
									placeholder="Digite seu nome completo"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* Email */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Email *
								</Text>
								<TextInput
									value={formData.email}
									onChangeText={(value) => handleInputChange('email', value)}
									placeholder="Digite seu email"
									keyboardType="email-address"
									autoCapitalize="none"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* Phone */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Telefone
								</Text>
								<TextInput
									value={formData.phone}
									onChangeText={(value) => handleInputChange('phone', value)}
									placeholder="Digite seu telefone"
									keyboardType="phone-pad"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>
						</View>
					</View>

					{/* Address Section */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: theme.radii.xl,
						padding: theme.spacing(4),
						marginTop: theme.spacing(4),
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						<Text style={{
							...theme.font.h3,
							color: theme.colors.text,
							marginBottom: theme.spacing(4),
							textAlign: 'center',
							fontWeight: '700',
						}}>
							Endereço
						</Text>

						<View style={{ gap: theme.spacing(4) }}>
							{/* Country */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									País
								</Text>
								<TextInput
									value={formData.country}
									onChangeText={(value) => handleInputChange('country', value)}
									placeholder="Digite o país"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* State */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Estado/Província
								</Text>
								<TextInput
									value={formData.state}
									onChangeText={(value) => handleInputChange('state', value)}
									placeholder="Digite o estado"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* City */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Cidade
								</Text>
								<TextInput
									value={formData.city}
									onChangeText={(value) => handleInputChange('city', value)}
									placeholder="Digite a cidade"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* Street */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Rua/Avenida
								</Text>
								<TextInput
									value={formData.street}
									onChangeText={(value) => handleInputChange('street', value)}
									placeholder="Digite a rua ou avenida"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* Number */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Número
								</Text>
								<TextInput
									value={formData.number}
									onChangeText={(value) => handleInputChange('number', value)}
									placeholder="Digite o número"
									style={inputStyle}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>

							{/* Reference */}
							<View>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									marginBottom: theme.spacing(1),
									fontWeight: '600',
								}}>
									Referência
								</Text>
								<TextInput
									value={formData.reference}
									onChangeText={(value) => handleInputChange('reference', value)}
									placeholder="Ponto de referência (opcional)"
									multiline
									numberOfLines={3}
									style={{
										...inputStyle,
										height: 80,
										textAlignVertical: 'top',
									}}
									placeholderTextColor={theme.colors.subtext}
									selectionColor={theme.colors.accent}
								/>
							</View>
						</View>
					</View>

					{/* Save Button */}
					<View style={{ marginTop: theme.spacing(6), marginBottom: theme.spacing(4) }}>
						<Button
							title={loading ? 'Salvando...' : 'Salvar Alterações'}
							onPress={handleSave}
							style={{
								...theme.shadow.button,
								paddingVertical: theme.spacing(3),
							}}
						/>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Screen>
	);
}


