import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Alert, FlatList, Text, View, Pressable, TextInput, Image, ScrollView } from 'react-native';
import { Animated, Easing } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../api/orders';
import { theme } from '../../theme';
import AnimatedButton from '../../components/AnimatedButton';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartScreen({ navigation }: any) {
	const { lines, subtotal, setQuantity, removeFromCart, clearCart } = useCart();
	const [coupon, setCoupon] = useState('');
	const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);
	
	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	useEffect(() => {
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
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 300,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	// Simple shipping and coupon rules for demo
	const shipping = useMemo(() => (subtotal >= 200 ? 0 : (lines.length ? 19.9 : 0)), [subtotal, lines.length]);
	const discount = useMemo(() => {
		if (!appliedCoupon) return 0;
		const code = appliedCoupon.trim().toUpperCase();
		if (code === 'SWIFT10') return subtotal * 0.10;
		if (code === 'FRETEGRATIS') return shipping; // cover shipping
		return 0;
	}, [appliedCoupon, subtotal, shipping]);
	const total = useMemo(() => Math.max(0, subtotal + shipping - discount), [subtotal, shipping, discount]);

	const inc = (id: number, current: number, size?: string) => {
		setIsAnimating(true);
		setQuantity(id, current + 1, size);
		setTimeout(() => setIsAnimating(false), 200);
	};
	
	const dec = (id: number, current: number, size?: string) => {
		setIsAnimating(true);
		setQuantity(id, Math.max(1, current - 1), size);
		setTimeout(() => setIsAnimating(false), 200);
	};

	const handleRemove = (id: number, size?: string) => {
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.9,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start(() => {
			removeFromCart(id, size);
		});
	};

	const checkout = async () => {
		if (!lines.length) return;
		try {
			await createOrder(lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })));
			clearCart();
			Alert.alert('Pedido', 'Pedido criado com sucesso!');
		} catch (e: any) {
			Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao criar pedido');
		}
	};

	return (
		<Animated.View style={{ 
			flex: 1, 
			backgroundColor: theme.colors.background,
			opacity: fadeAnim,
			transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
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
							Meu Carrinho
						</Text>
						<Text style={[theme.font.body, { color: theme.colors.subtext, marginTop: theme.spacing(0.5) }]}>
							{lines.length} {lines.length === 1 ? 'item' : 'itens'}
						</Text>
					</View>
					{lines.length > 0 && (
						<Pressable 
							onPress={clearCart}
							style={{
								backgroundColor: theme.colors.errorSoft,
								paddingHorizontal: theme.spacing(1.5),
								paddingVertical: theme.spacing(1),
								borderRadius: theme.radii.md,
								flexDirection: 'row',
								alignItems: 'center',
								gap: theme.spacing(0.5),
							}}
						>
							<Ionicons name="trash-outline" size={16} color={theme.colors.error} />
							<Text style={[theme.font.labelSmall, { color: theme.colors.error, fontWeight: '600' }]}>
								Limpar
							</Text>
						</Pressable>
					)}
				</View>
			</View>

			{lines.length === 0 ? (
				<EmptyState
					icon="cart-outline"
					title="Carrinho vazio"
					description="Adicione produtos ao seu carrinho para continuar comprando"
					actionLabel="Ver produtos"
					onAction={() => navigation.navigate('Catálogo')}
				/>
			) : (
				<>
					<ScrollView 
						style={{ flex: 1 }}
						contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: theme.spacing(2) }}
						showsVerticalScrollIndicator={false}
					>
					{lines.map((item, index) => (
						<Animated.View
							key={`cart-item-${index}-${item.product.id}-${item.selectedSize || 'default'}`}
							style={{
									backgroundColor: 'white',
									borderRadius: 20,
									padding: theme.spacing(3),
									marginBottom: theme.spacing(2),
									...theme.shadow.card,
									borderWidth: 1,
									borderColor: theme.colors.borderLight,
									transform: [{ scale: isAnimating ? 1.02 : 1 }],
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing(2) }}>
									<View style={{
										width: 80,
										height: 80,
										borderRadius: 16,
										backgroundColor: theme.colors.neutralSoft,
										marginRight: theme.spacing(2),
										overflow: 'hidden',
										...theme.shadow.button,
									}}>
										{item.product.image_url ? (
											<Image 
												source={{ uri: String(item.product.image_url) }} 
												style={{ width: '100%', height: '100%' }} 
												resizeMode="cover"
											/>
										) : (
											<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
												<Ionicons name="image-outline" size={32} color={theme.colors.subtext} />
											</View>
										)}
									</View>
									
									<View style={{ flex: 1 }}>
										<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(0.5) }]} numberOfLines={2}>
											{item.product.name}
										</Text>
										
										{/* Mostrar tamanho e cor selecionados */}
										{(item.selectedSize || item.selectedColor) && (
											<View style={{ 
												flexDirection: 'row', 
												alignItems: 'center', 
												gap: theme.spacing(1),
												marginBottom: theme.spacing(0.5),
												flexWrap: 'wrap',
											}}>
												{item.selectedSize && (
													<View style={{
														backgroundColor: theme.colors.accentSoft,
														paddingHorizontal: theme.spacing(1),
														paddingVertical: theme.spacing(0.5),
														borderRadius: 10,
														flexDirection: 'row',
														alignItems: 'center',
														gap: theme.spacing(0.5),
													}}>
														<Ionicons name="resize-outline" size={12} color={theme.colors.accent} />
														<Text style={[theme.font.labelSmall, { color: theme.colors.accent, fontWeight: '700' }]}>
															{item.selectedSize}
														</Text>
													</View>
												)}
												{item.selectedColor && (
													<View style={{
														backgroundColor: theme.colors.neutralSoft,
														paddingHorizontal: theme.spacing(1),
														paddingVertical: theme.spacing(0.5),
														borderRadius: 10,
														flexDirection: 'row',
														alignItems: 'center',
														gap: theme.spacing(0.5),
													}}>
														<Ionicons name="color-palette-outline" size={12} color={theme.colors.text} />
														<Text style={[theme.font.labelSmall, { color: theme.colors.text, fontWeight: '600' }]}>
															{item.selectedColor}
														</Text>
													</View>
												)}
											</View>
										)}
										
										<Text style={[theme.font.h4, { color: theme.colors.accent, fontWeight: '800' }]}>
											MT {item.product.price.toFixed(2)}
										</Text>
										<Text style={[theme.font.bodySmall, { color: theme.colors.subtext, marginTop: theme.spacing(0.5) }]}>
											Total: MT {(item.product.price * item.quantity).toFixed(2)}
										</Text>
									</View>

									<Pressable 
										onPress={() => handleRemove(item.product.id, item.selectedSize)}
										style={{
											backgroundColor: theme.colors.errorSoft,
											borderRadius: theme.radii.sm,
											padding: theme.spacing(1),
											...theme.shadow.button,
										}}
									>
										<Ionicons name="trash-outline" size={18} color={theme.colors.error} />
									</Pressable>
								</View>

								{/* Quantity Controls */}
								<View style={{ 
									flexDirection: 'row', 
									alignItems: 'center', 
									justifyContent: 'space-between',
									backgroundColor: theme.colors.neutralSoft,
									borderRadius: theme.radii.md,
									padding: theme.spacing(1.5),
								}}>
									<Text style={[theme.font.label, { color: theme.colors.text }]}>
										Quantidade
									</Text>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
										<Pressable 
											onPress={() => dec(item.product.id, item.quantity, item.selectedSize)}
											style={{
												backgroundColor: theme.colors.accent,
												borderRadius: theme.radii.full,
												width: 32,
												height: 32,
												justifyContent: 'center',
												alignItems: 'center',
												...theme.shadow.button,
											}}
										>
											<Ionicons name="remove" size={16} color="white" />
										</Pressable>
										
										<View style={{
											backgroundColor: 'white',
											borderRadius: theme.radii.sm,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(1),
											minWidth: 40,
											alignItems: 'center',
											...theme.shadow.button,
										}}>
											<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
												{item.quantity}
											</Text>
										</View>
										
										<Pressable 
											onPress={() => inc(item.product.id, item.quantity, item.selectedSize)}
											style={{
												backgroundColor: theme.colors.accent,
												borderRadius: theme.radii.full,
												width: 32,
												height: 32,
												justifyContent: 'center',
												alignItems: 'center',
												...theme.shadow.button,
											}}
										>
											<Ionicons name="add" size={16} color="white" />
										</Pressable>
									</View>
								</View>
							</Animated.View>
						))}
					</ScrollView>

					{/* Bottom Summary */}
					<View style={{
						backgroundColor: 'white',
						borderTopWidth: 1,
						borderTopColor: theme.colors.borderLight,
						padding: theme.spacing(3),
						...theme.shadow.card,
					}}>
						{/* Coupon Section */}
						<View style={{ marginBottom: theme.spacing(3) }}>
							<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
								Cupom de desconto
							</Text>
							<View style={{ flexDirection: 'row', gap: theme.spacing(1.5) }}>
								<View style={{ 
									flex: 1, 
									borderWidth: 1, 
									borderColor: appliedCoupon ? theme.colors.accent : theme.colors.border, 
									borderRadius: theme.radii.md, 
									backgroundColor: theme.colors.neutralSoft,
								}}>
									<TextInput
										placeholder="Digite seu cupom"
										value={coupon}
										onChangeText={setCoupon}
										style={{ 
											padding: theme.spacing(2),
											...theme.font.body,
										}}
										placeholderTextColor={theme.colors.subtext}
										autoCapitalize="characters"
									/>
								</View>
								<Pressable 
									onPress={() => setAppliedCoupon(coupon.trim())} 
									style={{ 
										backgroundColor: theme.colors.accent, 
										paddingHorizontal: theme.spacing(2), 
										paddingVertical: theme.spacing(2), 
										borderRadius: theme.radii.md,
										...theme.shadow.button,
									}}
								>
									<Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
										Aplicar
									</Text>
								</Pressable>
							</View>
							{appliedCoupon && (
								<View style={{
									backgroundColor: theme.colors.positiveSoft,
									padding: theme.spacing(1.5),
									borderRadius: theme.radii.md,
									marginTop: theme.spacing(1),
									flexDirection: 'row',
									alignItems: 'center',
									gap: theme.spacing(1),
								}}>
									<Ionicons name="checkmark-circle" size={16} color={theme.colors.positive} />
									<Text style={[theme.font.labelSmall, { color: theme.colors.positive, fontWeight: '600' }]}>
										Cupom "{appliedCoupon}" aplicado com sucesso!
									</Text>
								</View>
							)}
						</View>

						{/* Order Summary */}
						<View style={{
							backgroundColor: theme.colors.neutralSoft,
							borderRadius: theme.radii.lg,
							padding: theme.spacing(2.5),
							marginBottom: theme.spacing(3),
						}}>
							<Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
								Resumo do pedido
							</Text>
							
							<View style={{ gap: theme.spacing(1.5) }}>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
									<Text style={[theme.font.body, { color: theme.colors.subtext }]}>Subtotal</Text>
									<Text style={[theme.font.body, { fontWeight: '700', color: theme.colors.text }]}>
										MT {subtotal.toFixed(2)}
									</Text>
								</View>
								
								<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
									<Text style={[theme.font.body, { color: theme.colors.subtext }]}>Frete</Text>
									<Text style={[theme.font.body, { fontWeight: '700', color: shipping === 0 ? theme.colors.positive : theme.colors.text }]}>
										{shipping === 0 ? 'Grátis' : `MT ${shipping.toFixed(2)}`}
									</Text>
								</View>
								
								{discount > 0 && (
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										<Text style={[theme.font.body, { color: theme.colors.subtext }]}>Desconto</Text>
										<Text style={[theme.font.body, { fontWeight: '700', color: theme.colors.positive }]}>
											- MT {discount.toFixed(2)}
										</Text>
									</View>
								)}
								
								<View style={{ 
									height: 1, 
									backgroundColor: theme.colors.border, 
									marginVertical: theme.spacing(1) 
								}} />
								
								<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
									<Text style={[theme.font.h4, { color: theme.colors.text }]}>Total</Text>
									<Text style={[theme.font.h3, { color: theme.colors.accent, fontWeight: '800' }]}>
										MT {total.toFixed(2)}
									</Text>
								</View>
							</View>
						</View>

						<AnimatedButton 
							title="Finalizar compra" 
							onPress={() => navigation.navigate('Checkout')}
							fullWidth
							icon="checkmark-circle"
							iconPosition="right"
						/>
					</View>
				</>
			)}
		</Animated.View>
	);
}
