import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Text, View, Pressable, Animated, Easing, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import AnimatedButton from '../../components/AnimatedButton';
import { listOrders, downloadReceipt } from '../../api/orders';
import { Order } from '../../types';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function StatusChip({ status }: { status: string }) {
	const getStatusConfig = (status: string) => {
		switch (status) {
			case 'Entregue':
				return {
					color: theme.colors.positive,
					bgColor: theme.colors.positiveSoft,
					icon: 'checkmark-circle' as const,
				};
			case 'Enviado':
				return {
					color: theme.colors.info,
					bgColor: theme.colors.infoSoft,
					icon: 'car' as const,
				};
			case 'Processando':
				return {
					color: theme.colors.warning,
					bgColor: theme.colors.warningSoft,
					icon: 'time' as const,
				};
			case 'Pendente':
				return {
					color: theme.colors.warning,
					bgColor: theme.colors.warningSoft,
					icon: 'hourglass' as const,
				};
			default:
				return {
					color: theme.colors.subtext,
					bgColor: theme.colors.neutralSoft,
					icon: 'hourglass' as const,
				};
		}
	};

	const config = getStatusConfig(status);

	return (
		<View style={{ 
			backgroundColor: config.bgColor, 
			borderRadius: theme.radii.full, 
			paddingVertical: theme.spacing(0.5), 
			paddingHorizontal: theme.spacing(1.5),
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing(0.5),
			...theme.shadow.button,
		}}>
			<Ionicons name={config.icon} size={12} color={config.color} />
			<Text style={{ color: config.color, fontWeight: '700', ...theme.font.labelSmall }}>
				{status}
			</Text>
		</View>
	);
}

export default function OrdersScreen({ navigation }: any) {
	const [items, setItems] = useState<Order[]>([]);
	const [loading, setLoading] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;

	const loadOrders = async () => {
		setLoading(true);
		try {
			console.log('Carregando pedidos...');
			const res = await listOrders();
			console.log('Pedidos carregados:', res);
			setItems(res);
		} catch (error) {
			console.error('Erro ao carregar pedidos:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadOrders();
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			loadOrders();
		}, [])
	);

	useEffect(() => {
		if (!loading) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [loading]);

	if (loading) {
		return (
			<View style={{ 
				flex: 1, 
				backgroundColor: theme.colors.background, 
				padding: theme.spacing(2), 
				gap: theme.spacing(2) 
			}}>
				{/* Header Skeleton */}
				<View style={{
					backgroundColor: 'white',
					borderRadius: 20,
					padding: theme.spacing(3),
					marginBottom: theme.spacing(2),
					...theme.shadow.card,
				}}>
					<Skeleton height={24} width={'60%'} style={{ marginBottom: theme.spacing(1) }} />
					<Skeleton height={16} width={'40%'} />
				</View>

				{/* Order Cards Skeleton */}
				{[1, 2, 3].map((i) => (
					<View key={i} style={{ 
						backgroundColor: 'white', 
						borderRadius: 20, 
						padding: theme.spacing(3), 
						...theme.shadow.card,
						marginBottom: theme.spacing(2),
					}}>
						<Skeleton height={18} width={'50%'} style={{ marginBottom: theme.spacing(1) }} />
						<Skeleton height={14} width={'30%'} style={{ marginBottom: theme.spacing(1) }} />
						<Skeleton height={14} width={'40%'} style={{ marginBottom: theme.spacing(2) }} />
						<View style={{ flexDirection: 'row', gap: theme.spacing(2) }}>
							<Skeleton height={32} width={100} radius={theme.radii.md} />
							<Skeleton height={32} width={80} radius={theme.radii.md} />
						</View>
				</View>
				))}
			</View>
		);
	}

	return (
		<Animated.View style={{ 
			flex: 1, 
			backgroundColor: theme.colors.background,
			opacity: fadeAnim,
			transform: [{ translateY: slideAnim }]
		}}>
			{/* Header */}
			<View style={{
				backgroundColor: 'white',
				paddingHorizontal: theme.spacing(2),
				paddingTop: theme.spacing(6),
				paddingBottom: theme.spacing(3),
				borderBottomWidth: 1,
				borderBottomColor: theme.colors.borderLight,
				...theme.shadow.card,
			}}>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<View>
						<Text style={[theme.font.h3, { color: theme.colors.text }]}>
							Meus Pedidos
						</Text>
						<Text style={[theme.font.body, { color: theme.colors.subtext, marginTop: theme.spacing(0.5) }]}>
							{items.length} {items.length === 1 ? 'pedido' : 'pedidos'}
						</Text>
					</View>
					<View style={{
						backgroundColor: theme.colors.accentSoft,
						borderRadius: theme.radii.full,
						padding: theme.spacing(1.5),
						...theme.shadow.button,
					}}>
						<Ionicons name="receipt" size={20} color={theme.colors.accent} />
					</View>
				</View>
			</View>

			{items.length === 0 ? (
				<EmptyState
					icon="receipt-outline"
					title="Nenhum pedido ainda"
					description="Faça seu primeiro pedido e acompanhe aqui"
					actionLabel="Continuar comprando"
					onAction={() => navigation.navigate('Catálogo')}
				/>
			) : (
				<ScrollView 
					style={{ flex: 1 }}
					contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: theme.spacing(3) }}
					showsVerticalScrollIndicator={false}
				>
					{items.map((item, index) => (
						<Animated.View
							key={item.id}
							style={{
								backgroundColor: 'white',
								borderRadius: 20,
								padding: theme.spacing(3),
								marginBottom: theme.spacing(2),
								...theme.shadow.card,
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
							}}
						>
							{/* Order Header */}
							<View style={{ 
								flexDirection: 'row', 
								alignItems: 'center', 
								justifyContent: 'space-between',
								marginBottom: theme.spacing(2)
							}}>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) }}>
									<View style={{
										backgroundColor: theme.colors.accentSoft,
										borderRadius: 10,
										padding: theme.spacing(1),
									}}>
										<Ionicons name="receipt" size={16} color={theme.colors.accent} />
									</View>
									<Text style={[theme.font.h4, { color: theme.colors.text }]}>
										Pedido #{item.id}
									</Text>
								</View>
								<StatusChip status={item.status} />
							</View>

							{/* Order Details */}
							<View style={{ 
								backgroundColor: theme.colors.neutralSoft,
								borderRadius: 16,
								padding: theme.spacing(2),
								marginBottom: theme.spacing(2),
							}}>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(1) }}>
									<Text style={[theme.font.label, { color: theme.colors.subtext }]}>Itens</Text>
									<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
										{item.items.length} {item.items.length === 1 ? 'item' : 'itens'}
									</Text>
								</View>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(1) }}>
									<Text style={[theme.font.label, { color: theme.colors.subtext }]}>Data do pedido</Text>
									<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
										{new Date(item.created_at).toLocaleDateString('pt-BR')}
									</Text>
								</View>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
									<Text style={[theme.font.label, { color: theme.colors.subtext }]}>Hora</Text>
									<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
										{new Date(item.created_at).toLocaleTimeString('pt-BR', { 
											hour: '2-digit', 
											minute: '2-digit' 
										})}
									</Text>
								</View>
							</View>

						{/* Download Receipt Button */}
						<Pressable 
							onPress={async () => {
								try {
									await downloadReceipt(item.id);
									// Mensagem de sucesso (no mobile, o dialog de compartilhamento já aparece)
								} catch (error: any) {
									console.error('[OrdersScreen] Erro ao baixar recibo:', error);
									const errorMsg = error?.message || 'Não foi possível baixar o recibo. Verifique sua conexão e tente novamente.';
									Alert.alert('❌ Erro ao Baixar Recibo', errorMsg);
								}
							}} 
							style={{ 
								backgroundColor: theme.colors.positiveSoft,
								borderRadius: 16, 
								paddingVertical: theme.spacing(2),
								paddingHorizontal: theme.spacing(2),
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: theme.spacing(1.5),
								marginBottom: theme.spacing(2),
								...theme.shadow.button,
							}}
						>
							<Ionicons name="document-text" size={20} color={theme.colors.positive} />
							<Text style={[theme.font.label, { color: theme.colors.positive, fontWeight: '700', fontSize: 15 }]}>
								Baixar Recibo em PDF
							</Text>
							<Ionicons name="download" size={16} color={theme.colors.positive} />
						</Pressable>

						{/* Action Buttons */}
						<View style={{ flexDirection: 'row', gap: theme.spacing(1.5) }}>
							<Pressable 
								onPress={() => navigation.navigate('Rastreamento', { 
									orderId: item.id, 
									status: item.status, 
									courierPhone: '+258842767435' 
								})} 
								style={{ 
									flex: 1,
									backgroundColor: theme.colors.infoSoft, 
									borderRadius: 16, 
									paddingVertical: theme.spacing(1.5),
									paddingHorizontal: theme.spacing(2),
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									gap: theme.spacing(1),
									...theme.shadow.button,
								}}
							>
								<Ionicons name="car" size={16} color={theme.colors.info} />
								<Text style={[theme.font.label, { color: theme.colors.info, fontWeight: '700' }]}>
									Rastrear
								</Text>
							</Pressable>
							
							<Pressable 
								onPress={() => navigation.navigate('Suporte', { orderId: item.id })} 
								style={{ 
									flex: 1,
									backgroundColor: 'white', 
									borderRadius: 16, 
									paddingVertical: theme.spacing(1.5),
									paddingHorizontal: theme.spacing(2),
									borderWidth: 1,
									borderColor: theme.colors.border,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									gap: theme.spacing(1),
									...theme.shadow.button,
								}}
							>
								<Ionicons name="chatbubble-outline" size={16} color={theme.colors.text} />
								<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
									Suporte
								</Text>
							</Pressable>
						</View>
						</Animated.View>
					))}
				</ScrollView>
			)}
		</Animated.View>
	);
}
