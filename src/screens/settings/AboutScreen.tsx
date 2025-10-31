import React from 'react';
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

const { width } = Dimensions.get('window');

export default function AboutScreen() {
	const handleOpenLink = async (url: string) => {
		const canOpen = await Linking.canOpenURL(url);
		if (canOpen) {
			await Linking.openURL(url);
		} else {
			Alert.alert('Erro', 'Não é possível abrir este link.');
		}
	};

	const handleEmailContact = async () => {
		const email = 'contato@swiftshop.com';
		const subject = 'Contato SwiftShop';
		const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
		await handleOpenLink(url);
	};

	const handleCallSupport = async () => {
		const phoneNumber = '+258123456789';
		const url = `tel:${phoneNumber}`;
		await handleOpenLink(url);
	};

	const handleOpenWebsite = async () => {
		await handleOpenLink('https://www.swiftshop.com');
	};

	const handleOpenSocialMedia = async (platform: string) => {
		const urls: Record<string, string> = {
			facebook: 'https://facebook.com/swiftshop',
			instagram: 'https://instagram.com/swiftshop',
			twitter: 'https://twitter.com/swiftshop',
			linkedin: 'https://linkedin.com/company/swiftshop',
		};
		await handleOpenLink(urls[platform]);
	};

	const handleCheckUpdates = () => {
		Alert.alert(
			'Verificar Atualizações',
			'Sua versão está atualizada!\n\nVersão atual: 1.0.0',
			[{ text: 'OK' }]
		);
	};

	const handlePrivacyPolicy = () => {
		Alert.alert(
			'Política de Privacidade',
			'Em desenvolvimento. Em breve você poderá acessar nossa política de privacidade completa.',
			[{ text: 'OK' }]
		);
	};

	const handleTermsOfService = () => {
		Alert.alert(
			'Termos de Serviço',
			'Em desenvolvimento. Em breve você poderá acessar nossos termos de serviço completos.',
			[{ text: 'OK' }]
		);
	};

	return (
		<Screen title="Sobre o SwiftShop" showBackButton>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* App Info Card */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(6),
					marginBottom: theme.spacing(4),
					alignItems: 'center',
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					{/* App Icon */}
					<View style={{
						width: 80,
						height: 80,
						borderRadius: 20,
						backgroundColor: theme.colors.accent,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: theme.spacing(4),
						...theme.shadow.button,
					}}>
						<Text style={{
							color: 'white',
							fontSize: 32,
							fontWeight: '800',
						}}>
							S
						</Text>
					</View>

					<Text style={{
						...theme.font.h2,
						color: theme.colors.text,
						fontWeight: '800',
						marginBottom: theme.spacing(1),
					}}>
						SwiftShop
					</Text>

					<Text style={{
						...theme.font.body,
						color: theme.colors.subtext,
						textAlign: 'center',
						marginBottom: theme.spacing(3),
					}}>
						Sua loja online completa
					</Text>

					<Text style={{
						...theme.font.label,
						color: theme.colors.accent,
						fontWeight: '700',
					}}>
						Versão 1.0.0
					</Text>
				</View>

				{/* App Description */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(4),
					marginBottom: theme.spacing(4),
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Sobre o SwiftShop
					</Text>

					<Text style={{
						...theme.font.body,
						color: theme.colors.subtext,
						lineHeight: 22,
						marginBottom: theme.spacing(3),
					}}>
						O SwiftShop é uma plataforma de e-commerce moderna e intuitiva, desenvolvida para oferecer a melhor experiência de compra online. Nossa missão é conectar clientes com produtos de qualidade através de uma interface simples e funcionalidades avançadas.
					</Text>

					<Text style={{
						...theme.font.body,
						color: theme.colors.subtext,
						lineHeight: 22,
					}}>
						Desenvolvido com React Native e Expo, garantindo performance e compatibilidade em dispositivos iOS e Android.
					</Text>
				</View>

				{/* Features */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(4),
					marginBottom: theme.spacing(4),
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Principais Funcionalidades
					</Text>

					<View style={{ gap: theme.spacing(2) }}>
						{[
							{ icon: 'cart', text: 'Catálogo completo de produtos' },
							{ icon: 'card', text: 'Pagamento seguro e rápido' },
							{ icon: 'location', text: 'Rastreamento de pedidos em tempo real' },
							{ icon: 'finger-print', text: 'Autenticação biométrica (Face ID/Impressão Digital)' },
							{ icon: 'heart', text: 'Lista de favoritos personalizada' },
							{ icon: 'chatbubbles', text: 'Suporte ao cliente 24/7' },
						].map((feature, index) => (
							<View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View style={{
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: theme.colors.accentSoft,
									alignItems: 'center',
									justifyContent: 'center',
									marginRight: theme.spacing(3),
								}}>
									<Ionicons name={feature.icon as any} size={16} color={theme.colors.accent} />
								</View>
								<Text style={{
									...theme.font.body,
									color: theme.colors.text,
									flex: 1,
								}}>
									{feature.text}
								</Text>
							</View>
						))}
					</View>
				</View>

				{/* Contact Information */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(4),
					marginBottom: theme.spacing(4),
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Contato
					</Text>

					<View style={{ gap: theme.spacing(3) }}>
						<Pressable
							onPress={handleEmailContact}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingVertical: theme.spacing(2),
							}}
						>
							<Ionicons name="mail" size={20} color={theme.colors.accent} style={{ marginRight: theme.spacing(3) }} />
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									fontWeight: '600',
								}}>
									Email
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.subtext,
								}}>
									contato@swiftshop.com
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} />
						</Pressable>

						<Pressable
							onPress={handleCallSupport}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingVertical: theme.spacing(2),
							}}
						>
							<Ionicons name="call" size={20} color={theme.colors.success} style={{ marginRight: theme.spacing(3) }} />
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									fontWeight: '600',
								}}>
									Telefone
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.subtext,
								}}>
									+258 123 456 789
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} />
						</Pressable>

						<Pressable
							onPress={handleOpenWebsite}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								paddingVertical: theme.spacing(2),
							}}
						>
							<Ionicons name="globe" size={20} color={theme.colors.accent} style={{ marginRight: theme.spacing(3) }} />
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.text,
									fontWeight: '600',
								}}>
									Website
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.subtext,
								}}>
									www.swiftshop.com
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} />
						</Pressable>
					</View>
				</View>

				{/* Social Media */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(4),
					marginBottom: theme.spacing(4),
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Redes Sociais
					</Text>

					<View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
						{[
							{ name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
							{ name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
							{ name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
							{ name: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
						].map((social) => (
							<Pressable
								key={social.name}
								onPress={() => handleOpenSocialMedia(social.name.toLowerCase())}
								style={{
									width: 60,
									height: 60,
									borderRadius: 30,
									backgroundColor: `${social.color}15`,
									alignItems: 'center',
									justifyContent: 'center',
									...theme.shadow.button,
								}}
							>
								<Ionicons name={social.icon as any} size={24} color={social.color} />
							</Pressable>
						))}
					</View>
				</View>

				{/* Legal */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(4),
					marginBottom: theme.spacing(4),
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					<Text style={{
						...theme.font.h3,
						color: theme.colors.text,
						marginBottom: theme.spacing(3),
						fontWeight: '700',
					}}>
						Informações Legais
					</Text>

					<View style={{ gap: theme.spacing(2) }}>
						<Pressable
							onPress={handlePrivacyPolicy}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingVertical: theme.spacing(2),
							}}
						>
							<Text style={{
								...theme.font.label,
								color: theme.colors.text,
								fontWeight: '600',
							}}>
								Política de Privacidade
							</Text>
							<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} />
						</Pressable>

						<Pressable
							onPress={handleTermsOfService}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingVertical: theme.spacing(2),
							}}
						>
							<Text style={{
								...theme.font.label,
								color: theme.colors.text,
								fontWeight: '600',
							}}>
								Termos de Serviço
							</Text>
							<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} />
						</Pressable>
					</View>
				</View>

				{/* App Actions */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: theme.radii.xl,
					padding: theme.spacing(4),
					marginBottom: theme.spacing(4),
					...theme.shadow.card,
					borderWidth: 1,
					borderColor: theme.colors.borderLight,
				}}>
					<Pressable
						onPress={handleCheckUpdates}
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingVertical: theme.spacing(2),
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<Ionicons name="refresh" size={20} color={theme.colors.accent} style={{ marginRight: theme.spacing(3) }} />
							<Text style={{
								...theme.font.label,
								color: theme.colors.text,
								fontWeight: '600',
							}}>
								Verificar Atualizações
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={16} color={theme.colors.subtext} />
					</Pressable>
				</View>

				{/* Copyright */}
				<View style={{
					alignItems: 'center',
					paddingVertical: theme.spacing(4),
				}}>
					<Text style={{
						...theme.font.labelSmall,
						color: theme.colors.subtext,
						textAlign: 'center',
					}}>
						© 2024 SwiftShop. Todos os direitos reservados.
					</Text>
					<Text style={{
						...theme.font.labelSmall,
						color: theme.colors.subtext,
						textAlign: 'center',
						marginTop: theme.spacing(1),
					}}>
						Desenvolvido com ❤️ para você
					</Text>
				</View>
			</ScrollView>
		</Screen>
	);
}


