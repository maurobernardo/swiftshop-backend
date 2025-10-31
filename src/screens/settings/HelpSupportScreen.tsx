import React, { useState } from 'react';
import { 
	View, 
	Text, 
	ScrollView, 
	Pressable, 
	Alert,
	Linking,
	Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Screen from '../../components/Screen';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface HelpItem {
	id: string;
	title: string;
	description: string;
	icon: string;
	action: () => void;
	category: 'general' | 'orders' | 'account' | 'technical';
}

export default function HelpSupportScreen() {
	const navigation = useNavigation() as any;
	const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'orders' | 'account' | 'technical'>('all');

	const helpItems: HelpItem[] = [
		// General
		{
			id: 'how_to_buy',
			title: 'Como fazer uma compra?',
			description: 'Aprenda a navegar pelo catálogo, adicionar produtos ao carrinho e finalizar sua compra.',
			icon: 'cart-outline',
			category: 'general',
			action: () => Alert.alert('Como fazer uma compra', '1. Navegue pelo catálogo\n2. Toque no produto desejado\n3. Escolha tamanho e cor (se aplicável)\n4. Adicione ao carrinho\n5. Vá para o carrinho e finalize a compra'),
		},
		{
			id: 'search_products',
			title: 'Como pesquisar produtos?',
			description: 'Descubra como encontrar produtos específicos no catálogo.',
			icon: 'search-outline',
			category: 'general',
			action: () => Alert.alert('Pesquisar produtos', 'Use a barra de pesquisa na parte superior do catálogo para encontrar produtos por nome, categoria ou características.'),
		},
		{
			id: 'product_sizes',
			title: 'Como escolher tamanhos?',
			description: 'Entenda como selecionar o tamanho correto para sapatos, roupas e outros produtos.',
			icon: 'resize-outline',
			category: 'general',
			action: () => Alert.alert('Escolher tamanhos', 'Para produtos de vestuário (sapatos, camisas, etc.):\n• Toque no tamanho desejado\n• Veja as cores disponíveis\n• Visualize fotos específicas do tamanho\n• Verifique o estoque disponível'),
		},

		// Orders
		{
			id: 'track_order',
			title: 'Como rastrear meu pedido?',
			description: 'Saiba como acompanhar o status e localização do seu pedido.',
			icon: 'location-outline',
			category: 'orders',
			action: () => Alert.alert('Rastrear pedido', '1. Vá para a aba "Pedidos"\n2. Toque no pedido desejado\n3. Veja o status atual\n4. Acompanhe a localização em tempo real'),
		},
		{
			id: 'cancel_order',
			title: 'Posso cancelar meu pedido?',
			description: 'Informações sobre cancelamento de pedidos e políticas de reembolso.',
			icon: 'close-circle-outline',
			category: 'orders',
			action: () => Alert.alert('Cancelar pedido', 'Pedidos podem ser cancelados até 24h após a confirmação. Entre em contato conosco para solicitar o cancelamento.'),
		},
		{
			id: 'return_product',
			title: 'Como devolver um produto?',
			description: 'Processo para devolução de produtos e solicitação de troca.',
			icon: 'return-up-back-outline',
			category: 'orders',
			action: () => Alert.alert('Devolução', '1. Entre em contato conosco\n2. Informe o número do pedido\n3. Explique o motivo da devolução\n4. Aguarde as instruções de envio'),
		},

		// Account
		{
			id: 'change_password',
			title: 'Como alterar minha senha?',
			description: 'Passo a passo para alterar sua senha de acesso.',
			icon: 'key-outline',
			category: 'account',
			action: () => {
				Alert.alert('Alterar senha', '1. Vá para Configurações\n2. Toque em "Alterar Senha"\n3. Digite sua senha atual\n4. Digite a nova senha\n5. Confirme a nova senha');
			},
		},
		{
			id: 'biometric_login',
			title: 'Como usar Face ID/Impressão Digital?',
			description: 'Configure e use autenticação biométrica para login rápido.',
			icon: 'finger-print-outline',
			category: 'account',
			action: () => Alert.alert('Autenticação biométrica', '1. Vá para Configurações\n2. Toque em "Autenticação Biométrica"\n3. Habilite a opção\n4. Use sua biometria para login futuro'),
		},
		{
			id: 'edit_profile',
			title: 'Como editar meu perfil?',
			description: 'Atualize suas informações pessoais e endereço.',
			icon: 'person-outline',
			category: 'account',
			action: () => {
				navigation.navigate('Perfil');
			},
		},

		// Technical
		{
			id: 'app_not_working',
			title: 'O app não está funcionando',
			description: 'Soluções para problemas comuns do aplicativo.',
			icon: 'bug-outline',
			category: 'technical',
			action: () => Alert.alert('Problemas do app', '• Verifique sua conexão com a internet\n• Feche e abra o app novamente\n• Reinicie seu dispositivo\n• Atualize o aplicativo\n• Limpe o cache nas configurações'),
		},
		{
			id: 'payment_issues',
			title: 'Problemas com pagamento',
			description: 'Resolução de problemas relacionados a pagamentos.',
			icon: 'card-outline',
			category: 'technical',
			action: () => Alert.alert('Problemas de pagamento', '• Verifique se o cartão está válido\n• Confirme os dados do cartão\n• Tente outro método de pagamento\n• Entre em contato com seu banco\n• Use um cartão diferente'),
		},
		{
			id: 'images_not_loading',
			title: 'Imagens não carregam',
			description: 'Como resolver problemas de carregamento de imagens.',
			icon: 'image-outline',
			category: 'technical',
			action: () => Alert.alert('Imagens não carregam', '• Verifique sua conexão com a internet\n• Limpe o cache do app\n• Reinicie o aplicativo\n• Atualize para a versão mais recente'),
		},
	];

	const categories = [
		{ id: 'all', name: 'Todos', icon: 'grid-outline' },
		{ id: 'general', name: 'Geral', icon: 'help-circle-outline' },
		{ id: 'orders', name: 'Pedidos', icon: 'receipt-outline' },
		{ id: 'account', name: 'Conta', icon: 'person-circle-outline' },
		{ id: 'technical', name: 'Técnico', icon: 'settings-outline' },
	];

	const filteredItems = selectedCategory === 'all' 
		? helpItems 
		: helpItems.filter(item => item.category === selectedCategory);

	const handleContactSupport = () => {
		navigation.navigate('Suporte');
	};

	const handleCallSupport = async () => {
		const phoneNumber = '+258123456789';
		const url = `tel:${phoneNumber}`;
		const canOpen = await Linking.canOpenURL(url);
		
		if (canOpen) {
			await Linking.openURL(url);
		} else {
			Alert.alert('Erro', 'Não é possível fazer ligações neste dispositivo.');
		}
	};

	const handleEmailSupport = async () => {
		const email = 'suporte@swiftshop.com';
		const subject = 'Suporte SwiftShop';
		const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
		
		const canOpen = await Linking.canOpenURL(url);
		if (canOpen) {
			await Linking.openURL(url);
		} else {
			Alert.alert('Email', `Entre em contato: ${email}`);
		}
	};

	return (
		<Screen title="Ajuda e Suporte" showBackButton>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Contact Support Cards */}
				<View style={{ marginBottom: theme.spacing(4) }}>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Contato Direto
					</Text>
					
					<View style={{ gap: theme.spacing(3) }}>
						<Pressable
							onPress={handleContactSupport}
							style={{
								backgroundColor: 'white',
								borderRadius: 20,
								padding: theme.spacing(4),
								flexDirection: 'row',
								alignItems: 'center',
								...theme.shadow.card,
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
							}}
						>
							<View style={{
								width: 50,
								height: 50,
								borderRadius: 25,
								backgroundColor: theme.colors.accentSoft,
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: theme.spacing(3),
							}}>
								<Ionicons name="chatbubbles" size={24} color={theme.colors.accent} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									fontWeight: '700',
									marginBottom: 4,
								}}>
									Chat de Suporte
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.subtext,
								}}>
									Converse diretamente com nossa equipe
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
						</Pressable>

						<Pressable
							onPress={handleCallSupport}
							style={{
								backgroundColor: 'white',
								borderRadius: 20,
								padding: theme.spacing(4),
								flexDirection: 'row',
								alignItems: 'center',
								...theme.shadow.card,
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
							}}
						>
							<View style={{
								width: 50,
								height: 50,
								borderRadius: 25,
								backgroundColor: theme.colors.successSoft,
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: theme.spacing(3),
							}}>
								<Ionicons name="call" size={24} color={theme.colors.success} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									fontWeight: '700',
									marginBottom: 4,
								}}>
									Ligar para Suporte
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.subtext,
								}}>
									+258 123 456 789
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
						</Pressable>

						<Pressable
							onPress={handleEmailSupport}
							style={{
								backgroundColor: 'white',
								borderRadius: 20,
								padding: theme.spacing(4),
								flexDirection: 'row',
								alignItems: 'center',
								...theme.shadow.card,
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
							}}
						>
							<View style={{
								width: 50,
								height: 50,
								borderRadius: 25,
								backgroundColor: theme.colors.accentSoft,
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: theme.spacing(3),
							}}>
								<Ionicons name="mail" size={24} color={theme.colors.accent} />
							</View>
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									fontWeight: '700',
									marginBottom: 4,
								}}>
									Enviar Email
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.subtext,
								}}>
									suporte@swiftshop.com
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
						</Pressable>
					</View>
				</View>

				{/* FAQ Section */}
				<View>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Perguntas Frequentes
					</Text>

					{/* Category Filter */}
					<ScrollView 
						horizontal 
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingVertical: theme.spacing(2) }}
					>
						{categories.map((category) => (
							<Pressable
								key={category.id}
								onPress={() => setSelectedCategory(category.id as any)}
								style={{
									marginRight: theme.spacing(2),
									paddingHorizontal: theme.spacing(3),
									paddingVertical: theme.spacing(2),
									borderRadius: theme.radii.full,
									backgroundColor: selectedCategory === category.id ? theme.colors.accent : 'white',
									borderWidth: 1,
									borderColor: selectedCategory === category.id ? theme.colors.accent : theme.colors.borderLight,
									flexDirection: 'row',
									alignItems: 'center',
									...theme.shadow.button,
								}}
							>
								<Ionicons 
									name={category.icon as any} 
									size={16} 
									color={selectedCategory === category.id ? 'white' : theme.colors.subtext}
									style={{ marginRight: theme.spacing(1) }}
								/>
								<Text style={{
									...theme.font.labelSmall,
									color: selectedCategory === category.id ? 'white' : theme.colors.text,
									fontWeight: '600',
								}}>
									{category.name}
								</Text>
							</Pressable>
						))}
					</ScrollView>

					{/* FAQ Items */}
					<View style={{ marginTop: theme.spacing(3) }}>
						{filteredItems.map((item, index) => (
							<Pressable
								key={item.id}
								onPress={item.action}
								style={{
									backgroundColor: 'white',
									borderRadius: 20,
									padding: theme.spacing(4),
									marginBottom: theme.spacing(3),
									...theme.shadow.card,
									borderWidth: 1,
									borderColor: theme.colors.borderLight,
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
									<View style={{
										width: 40,
										height: 40,
										borderRadius: 20,
										backgroundColor: theme.colors.accentSoft,
										alignItems: 'center',
										justifyContent: 'center',
										marginRight: theme.spacing(3),
										marginTop: 2,
									}}>
										<Ionicons name={item.icon as any} size={20} color={theme.colors.accent} />
									</View>
									<View style={{ flex: 1 }}>
										<Text style={{
											...theme.font.label,
											color: theme.colors.text,
											fontWeight: '700',
											marginBottom: theme.spacing(1),
										}}>
											{item.title}
										</Text>
										<Text style={{
											...theme.font.body,
											color: theme.colors.subtext,
											lineHeight: 20,
										}}>
											{item.description}
										</Text>
									</View>
									<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} style={{ marginTop: 2 }} />
								</View>
							</Pressable>
						))}
					</View>
				</View>

				{/* Bottom Spacing */}
				<View style={{ height: theme.spacing(4) }} />
			</ScrollView>
		</Screen>
	);
}
