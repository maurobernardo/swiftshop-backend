import React, { useState, useEffect } from 'react';
import { 
	View, 
	Text, 
	ScrollView, 
	Pressable, 
	Alert, 
	Switch, 
	Modal,
	TextInput,
	KeyboardAvoidingView,
	Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import Screen from '../../components/Screen';
import BiometricSettings from '../../components/BiometricSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface SettingsSection {
	title: string;
	items: SettingsItem[];
}

interface SettingsItem {
	id: string;
	title: string;
	subtitle?: string;
	icon: string;
	type: 'toggle' | 'navigation' | 'action' | 'info';
	value?: boolean;
	onPress?: () => void;
	onToggle?: (value: boolean) => void;
	destructive?: boolean;
}

export default function SettingsScreen() {
	const { user, logout } = useAuth();
	const navigation = useNavigation() as any;
	const [settings, setSettings] = useState<SettingsSection[]>([]);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [darkModeEnabled, setDarkModeEnabled] = useState(false);
	const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
	const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		try {
			// Carregar configurações salvas
			const savedNotifications = await AsyncStorage.getItem('notifications_enabled');
			const savedDarkMode = await AsyncStorage.getItem('dark_mode_enabled');
			const savedAutoSync = await AsyncStorage.getItem('auto_sync_enabled');
			
			setNotificationsEnabled(savedNotifications !== 'false');
			setDarkModeEnabled(savedDarkMode === 'true');
			setAutoSyncEnabled(savedAutoSync !== 'false');
		} catch (error) {
			console.error('Erro ao carregar configurações:', error);
		}
	};

	const saveSetting = async (key: string, value: boolean) => {
		try {
			await AsyncStorage.setItem(key, value.toString());
		} catch (error) {
			console.error('Erro ao salvar configuração:', error);
		}
	};

	const handleNotificationsToggle = async (value: boolean) => {
		setNotificationsEnabled(value);
		await saveSetting('notifications_enabled', value);
	};

	const handleDarkModeToggle = async (value: boolean) => {
		setDarkModeEnabled(value);
		await saveSetting('dark_mode_enabled', value);
		Alert.alert(
			'Modo Escuro',
			'O modo escuro será implementado em uma versão futura.',
			[{ text: 'OK' }]
		);
	};

	const handleAutoSyncToggle = async (value: boolean) => {
		setAutoSyncEnabled(value);
		await saveSetting('auto_sync_enabled', value);
	};

	const handleChangePassword = () => {
		setShowChangePasswordModal(true);
	};

	const handleSaveNewPassword = async () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
			return;
		}

		if (newPassword !== confirmPassword) {
			Alert.alert('Erro', 'As senhas não coincidem.');
			return;
		}

		if (newPassword.length < 6) {
			Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
			return;
		}

		try {
			// Aqui você implementaria a lógica para alterar a senha no backend
			Alert.alert(
				'Senha Alterada',
				'Sua senha foi alterada com sucesso.',
				[{ text: 'OK', onPress: () => setShowChangePasswordModal(false) }]
			);
			
			// Limpar campos
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		} catch (error) {
			Alert.alert('Erro', 'Não foi possível alterar a senha.');
		}
	};

	const handleLogout = () => {
		Alert.alert(
			'Confirmar Logout',
			'Tem certeza que deseja sair da sua conta?',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{ text: 'Sair', style: 'destructive', onPress: logout }
			]
		);
	};

	const handleClearCache = () => {
		Alert.alert(
			'Limpar Cache',
			'Isso removerá dados temporários e pode melhorar o desempenho do app.',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{ 
					text: 'Limpar', 
					onPress: async () => {
						try {
							// Limpar cache (excluindo configurações importantes)
							const keys = await AsyncStorage.getAllKeys();
							const keysToRemove = keys.filter(key => 
								!key.startsWith('biometric_') && 
								!key.startsWith('notifications_') &&
								!key.startsWith('dark_mode_') &&
								!key.startsWith('auto_sync_')
							);
							await AsyncStorage.multiRemove(keysToRemove);
							Alert.alert('Sucesso', 'Cache limpo com sucesso.');
						} catch (error) {
							Alert.alert('Erro', 'Não foi possível limpar o cache.');
						}
					}
				}
			]
		);
	};

	const handleAbout = () => {
		Alert.alert(
			'Sobre o SwiftShop',
			'Versão 1.0.0\n\nSwiftShop - Sua loja online completa\n\nDesenvolvido com React Native e Expo',
			[{ text: 'OK' }]
		);
	};

	const settingsData: SettingsSection[] = [
		{
			title: 'Conta',
			items: [
				{
					id: 'profile',
					title: 'Editar Perfil',
					subtitle: user?.email || 'Atualizar informações pessoais',
					icon: 'person-outline',
					type: 'navigation',
					onPress: () => navigation.navigate('Perfil'),
				},
				{
					id: 'change_password',
					title: 'Alterar Senha',
					subtitle: 'Atualizar sua senha de acesso',
					icon: 'key-outline',
					type: 'action',
					onPress: handleChangePassword,
				},
				{
					id: 'logout',
					title: 'Sair da Conta',
					subtitle: 'Fazer logout do aplicativo',
					icon: 'log-out-outline',
					type: 'action',
					onPress: handleLogout,
					destructive: true,
				},
			],
		},
		{
			title: 'Segurança',
			items: [
				{
					id: 'biometric',
					title: 'Autenticação Biométrica',
					subtitle: 'Face ID ou impressão digital',
					icon: 'finger-print-outline',
					type: 'info',
				},
			],
		},
		{
			title: 'Notificações',
			items: [
				{
					id: 'notifications',
					title: 'Notificações Push',
					subtitle: 'Receber notificações do app',
					icon: 'notifications-outline',
					type: 'toggle',
					value: notificationsEnabled,
					onToggle: handleNotificationsToggle,
				},
			],
		},
		{
			title: 'Aparência',
			items: [
				{
					id: 'dark_mode',
					title: 'Modo Escuro',
					subtitle: 'Usar tema escuro',
					icon: 'moon-outline',
					type: 'toggle',
					value: darkModeEnabled,
					onToggle: handleDarkModeToggle,
				},
			],
		},
		{
			title: 'Dados',
			items: [
				{
					id: 'auto_sync',
					title: 'Sincronização Automática',
					subtitle: 'Sincronizar dados automaticamente',
					icon: 'sync-outline',
					type: 'toggle',
					value: autoSyncEnabled,
					onToggle: handleAutoSyncToggle,
				},
				{
					id: 'clear_cache',
					title: 'Limpar Cache',
					subtitle: 'Remover dados temporários',
					icon: 'trash-outline',
					type: 'action',
					onPress: handleClearCache,
				},
			],
		},
		{
			title: 'Suporte',
			items: [
				{
					id: 'help',
					title: 'Ajuda e Suporte',
					subtitle: 'Central de ajuda e FAQ',
					icon: 'help-circle-outline',
					type: 'navigation',
					onPress: () => navigation.navigate('Ajuda'),
				},
				{
					id: 'feedback',
					title: 'Enviar Feedback',
					subtitle: 'Reportar problemas ou sugestões',
					icon: 'chatbubble-outline',
					type: 'navigation',
					onPress: () => navigation.navigate('Feedback'),
				},
				{
					id: 'about',
					title: 'Sobre o App',
					subtitle: 'Informações do aplicativo',
					icon: 'information-circle-outline',
					type: 'navigation',
					onPress: () => navigation.navigate('Sobre'),
				},
			],
		},
	];

	const renderSettingsItem = (item: SettingsItem) => {
		const itemStyle = {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			paddingVertical: theme.spacing(3),
			paddingHorizontal: theme.spacing(3),
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.borderLight,
		};

		const iconStyle = {
			width: 24,
			height: 24,
			marginRight: theme.spacing(3),
			color: item.destructive ? theme.colors.error : theme.colors.subtext,
		};

		const textStyle = {
			flex: 1,
		};

		const titleStyle = {
			...theme.font.label,
			color: item.destructive ? theme.colors.error : theme.colors.text,
			fontWeight: '600' as const,
		};

		const subtitleStyle = {
			...theme.font.body,
			color: theme.colors.subtext,
			marginTop: 2,
		};

		if (item.type === 'toggle') {
			return (
				<View key={item.id} style={itemStyle}>
					<Ionicons name={item.icon as any} size={24} style={iconStyle} />
					<View style={textStyle}>
						<Text style={titleStyle}>{item.title}</Text>
						{item.subtitle && <Text style={subtitleStyle}>{item.subtitle}</Text>}
					</View>
					<Switch
						value={item.value}
						onValueChange={item.onToggle}
						trackColor={{ false: theme.colors.borderLight, true: theme.colors.accentSoft }}
						thumbColor={item.value ? theme.colors.accent : theme.colors.subtext}
					/>
				</View>
			);
		}

		if (item.type === 'info') {
			return (
				<View key={item.id} style={[itemStyle, { paddingVertical: theme.spacing(2) }]}>
					<Ionicons name={item.icon as any} size={24} style={iconStyle} />
					<View style={textStyle}>
						<Text style={titleStyle}>{item.title}</Text>
						{item.subtitle && <Text style={subtitleStyle}>{item.subtitle}</Text>}
					</View>
				</View>
			);
		}

		return (
			<Pressable
				key={item.id}
				onPress={item.onPress}
				style={({ pressed }) => [
					itemStyle,
					{ backgroundColor: pressed ? theme.colors.neutralSoft : 'transparent' }
				]}
			>
				<Ionicons name={item.icon as any} size={24} style={iconStyle} />
				<View style={textStyle}>
					<Text style={titleStyle}>{item.title}</Text>
					{item.subtitle && <Text style={subtitleStyle}>{item.subtitle}</Text>}
				</View>
				<Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
			</Pressable>
		);
	};

	return (
		<Screen title="Configurações" showBackButton>
			<ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
				{settingsData.map((section, index) => (
					<View key={index} style={{ marginBottom: theme.spacing(4) }}>
						{/* Section Title */}
						<Text style={[
							theme.font.h4,
							{
								color: theme.colors.text,
								marginBottom: theme.spacing(2),
								marginHorizontal: theme.spacing(3),
								fontWeight: '700',
							}
						]}>
							{section.title}
						</Text>

						{/* Section Items */}
						<View style={{
							backgroundColor: 'white',
							borderRadius: 24,
							...theme.shadow.card,
							borderWidth: 1,
							borderColor: theme.colors.borderLight,
							overflow: 'hidden',
						}}>
							{section.items.map((item, itemIndex) => (
								<View key={item.id}>
									{item.id === 'biometric' ? (
										<View style={{ padding: theme.spacing(3) }}>
											<BiometricSettings compact />
										</View>
									) : (
										renderSettingsItem(item)
									)}
									{itemIndex < section.items.length - 1 && (
										<View style={{
											marginLeft: theme.spacing(3) + 24 + theme.spacing(3),
											height: 1,
											backgroundColor: theme.colors.borderLight,
										}} />
									)}
								</View>
							))}
						</View>
					</View>
				))}
			</ScrollView>

			{/* Modal para alterar senha */}
			<Modal
				visible={showChangePasswordModal}
				animationType="slide"
				presentationStyle="pageSheet"
			>
				<KeyboardAvoidingView 
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={{ flex: 1, backgroundColor: theme.colors.background }}
				>
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingHorizontal: theme.spacing(3),
						paddingTop: theme.spacing(2),
						paddingBottom: theme.spacing(2),
						borderBottomWidth: 1,
						borderBottomColor: theme.colors.borderLight,
					}}>
						<Pressable onPress={() => setShowChangePasswordModal(false)}>
							<Text style={{ color: theme.colors.accent, ...theme.font.label, fontWeight: '600' }}>
								Cancelar
							</Text>
						</Pressable>
						<Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '700' }]}>
							Alterar Senha
						</Text>
						<Pressable onPress={handleSaveNewPassword}>
							<Text style={{ color: theme.colors.accent, ...theme.font.label, fontWeight: '600' }}>
								Salvar
							</Text>
						</Pressable>
					</View>

					<ScrollView style={{ flex: 1, padding: theme.spacing(3) }}>
						<View style={{
							backgroundColor: 'white',
							borderRadius: 24,
							padding: theme.spacing(3),
							...theme.shadow.card,
						}}>
							<View style={{ gap: theme.spacing(3) }}>
								<View>
									<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
										Senha Atual
									</Text>
									<TextInput
										placeholder="Digite sua senha atual"
										secureTextEntry
										value={currentPassword}
										onChangeText={setCurrentPassword}
										style={{
											borderWidth: 1,
											borderColor: theme.colors.borderLight,
											borderRadius: 20,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(2),
											backgroundColor: theme.colors.neutralSoft,
											color: theme.colors.text,
										}}
									/>
								</View>

								<View>
									<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
										Nova Senha
									</Text>
									<TextInput
										placeholder="Digite a nova senha"
										secureTextEntry
										value={newPassword}
										onChangeText={setNewPassword}
										style={{
											borderWidth: 1,
											borderColor: theme.colors.borderLight,
											borderRadius: 20,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(2),
											backgroundColor: theme.colors.neutralSoft,
											color: theme.colors.text,
										}}
									/>
								</View>

								<View>
									<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
										Confirmar Nova Senha
									</Text>
									<TextInput
										placeholder="Confirme a nova senha"
										secureTextEntry
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										style={{
											borderWidth: 1,
											borderColor: theme.colors.borderLight,
											borderRadius: 20,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(2),
											backgroundColor: theme.colors.neutralSoft,
											color: theme.colors.text,
										}}
									/>
								</View>
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</Modal>
		</Screen>
	);
}
