import React from 'react';
import { Text, View, FlatList, Pressable, Image, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import AnimatedButton from '../../components/AnimatedButton';
import AnimatedScreen from '../../components/AnimatedScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { getProduct } from '../../api/products';
import { Product, Order } from '../../types';
import ProductCard from '../../components/ProductCard';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '../../api/uploads';
import { updateMe } from '../../api/users';
import { listOrders } from '../../api/orders';
import { getFullImageUrl } from '../../utils/imageUtils';

export default function ProfileScreen() {
	const { name, email, role, logout, avatarUrl: ctxAvatar, phone, country, state, city, street, number, reference, refreshMe } = useAuth();
	const { favorites } = useFavorites();
	const [favItems, setFavItems] = useState<Product[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);
	const [limit, setLimit] = useState(10);

	useEffect(() => {
		(async () => {
			const results: Product[] = [];
			for (const id of favorites) {
				try { results.push(await getProduct(id)); } catch {}
			}
			setFavItems(results);
			try { setOrders(await listOrders()); } catch {}
		})();
	}, [favorites]);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const navigation = useNavigation() as any;

    useEffect(() => {
        setAvatarUrl(ctxAvatar ?? undefined);
    }, [ctxAvatar]);

	const onPickAvatar = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') return;
		const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
		if (result.canceled || !result.assets?.length) return;
		const localUri = result.assets[0].uri;
		const remoteUrl = await uploadImageAsync(localUri);
		setAvatarUrl(remoteUrl);
		try {
			await updateMe({ avatar_url: remoteUrl } as any);
			await refreshMe();
		} catch {}
	};

return (
	<AnimatedScreen scrollable>
		<View style={{ paddingBottom: theme.spacing(3) }}>
			{/* Header with Profile Info */}
			<View style={{ 
				alignItems: 'center', 
				paddingTop: theme.spacing(6), 
				paddingBottom: theme.spacing(4),
				backgroundColor: 'white',
				marginBottom: theme.spacing(2),
				...theme.shadow.card,
			}}>
				<Pressable 
					onPress={onPickAvatar} 
					style={{ 
						width: 120, 
						height: 120, 
						borderRadius: 60, 
						backgroundColor: theme.colors.neutralSoft, 
						alignItems: 'center', 
						justifyContent: 'center', 
						borderWidth: 3, 
						borderColor: theme.colors.accent, 
						overflow: 'hidden',
						...theme.shadow.card,
					}}
				>
					{avatarUrl ? (
						<Image source={{ uri: getFullImageUrl(avatarUrl) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
					) : (
						<Ionicons name="person" size={64} color={theme.colors.subtext} />
					)}
					<View style={{ 
						position: 'absolute', 
						bottom: 6, 
						right: 6, 
						backgroundColor: 'white', 
						borderRadius: theme.radii.sm, 
						padding: 8, 
						borderWidth: 1, 
						borderColor: theme.colors.border,
						...theme.shadow.button,
					}}>
						<Ionicons name="camera" size={16} color={theme.colors.primary} />
					</View>
				</Pressable>
				<Text style={{ 
					marginTop: theme.spacing(2), 
					...theme.font.h3,
					color: theme.colors.text,
				}}>
					{name || 'Usuário'}
				</Text>
				<Text style={{ 
					color: theme.colors.subtext,
					...theme.font.body,
					marginTop: theme.spacing(0.5),
				}}>
					{email}
				</Text>
				<View style={{
					backgroundColor: theme.colors.accentSoft,
					paddingHorizontal: theme.spacing(2),
					paddingVertical: theme.spacing(0.5),
					borderRadius: theme.radii.full,
					marginTop: theme.spacing(1),
				}}>
					<Text style={{ 
						color: theme.colors.accent, 
						...theme.font.labelSmall,
						fontWeight: '700',
					}}>
						{role === 'admin' ? 'Administrador' : 'Cliente'}
					</Text>
				</View>
			</View>
        <View style={{ padding: theme.spacing(2), gap: theme.spacing(3) }}>
			{/* Personal Data */}
			<View style={{ 
				backgroundColor: 'white', 
				borderRadius: 20, 
				borderWidth: 1, 
				borderColor: theme.colors.borderLight, 
				padding: theme.spacing(3),
				...theme.shadow.card,
			}}>
				<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) }}>
					<View style={{
						backgroundColor: theme.colors.accentSoft,
						borderRadius: 10,
						padding: theme.spacing(1),
						marginRight: theme.spacing(1.5),
					}}>
						<Ionicons name="person" size={20} color={theme.colors.accent} />
					</View>
					<Text style={[theme.font.h4, { color: theme.colors.text }]}>
						Informações pessoais
					</Text>
				</View>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(3), justifyContent: 'center' }}>
					{[
						{ icon: 'call', label: 'Telefone', value: phone || '—', color: theme.colors.info },
						{ icon: 'flag', label: 'País', value: country || '—', color: theme.colors.positive },
						{ icon: 'navigate', label: 'Estado', value: state || '—', color: theme.colors.warning },
						{ icon: 'location', label: 'Cidade', value: city || '—', color: theme.colors.accent },
					].map((f) => (
						<View key={f.label} style={{ 
							width: '45%', 
							backgroundColor: theme.colors.neutralSoft, 
							borderWidth: 1, 
							borderColor: theme.colors.borderLight, 
							borderRadius: 20, 
							padding: theme.spacing(3),
							...theme.shadow.card,
							alignItems: 'center',
							textAlign: 'center',
						}}>
							<View style={{ 
								flexDirection: 'row', 
								alignItems: 'center', 
								gap: theme.spacing(1), 
								marginBottom: theme.spacing(1),
								justifyContent: 'center'
							}}>
								<Ionicons name={f.icon as any} size={18} color={f.color} />
								<Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '600' }]}>
									{f.label}
								</Text>
							</View>
							<Text style={[theme.font.h4, { fontWeight: '700', color: theme.colors.text, textAlign: 'center' }]}>
								{f.value}
							</Text>
						</View>
					))}
				</View>

				{/* Botão Editar Perfil */}
				<Pressable
					onPress={() => navigation.navigate('EditarPerfil')}
					style={{
						backgroundColor: theme.colors.accent,
						borderRadius: 20,
						padding: theme.spacing(2),
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: theme.spacing(1.5),
						marginTop: theme.spacing(2),
						...theme.shadow.button,
					}}
				>
					<Ionicons name="create" size={20} color="white" />
					<Text style={[theme.font.h4, { color: 'white', fontWeight: '700' }]}>
						Editar Perfil
					</Text>
				</Pressable>
			</View>

			{/* Address Data */}
			<View style={{ 
				backgroundColor: 'white', 
				borderRadius: 20, 
				borderWidth: 1, 
				borderColor: theme.colors.borderLight, 
				padding: theme.spacing(3),
				...theme.shadow.card,
			}}>
				<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) }}>
					<View style={{
						backgroundColor: theme.colors.positiveSoft,
						borderRadius: 10,
						padding: theme.spacing(1),
						marginRight: theme.spacing(1.5),
					}}>
						<Ionicons name="map" size={20} color={theme.colors.positive} />
					</View>
					<Text style={[theme.font.h4, { color: theme.colors.text }]}>
						Endereço de entrega
					</Text>
				</View>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(3), justifyContent: 'center' }}>
					{[
						{ icon: 'map', label: 'Rua', value: street || '—', color: theme.colors.accent },
						{ icon: 'home', label: 'Número', value: number || '—', color: theme.colors.info },
						{ icon: 'pin', label: 'Referência', value: reference || '—', color: theme.colors.warning },
					].map((f) => (
						<View key={f.label} style={{ 
							width: '45%', 
							backgroundColor: theme.colors.neutralSoft, 
							borderWidth: 1, 
							borderColor: theme.colors.borderLight, 
							borderRadius: 20, 
							padding: theme.spacing(3),
							...theme.shadow.card,
							alignItems: 'center',
							textAlign: 'center',
						}}>
							<View style={{ 
								flexDirection: 'row', 
								alignItems: 'center', 
								gap: theme.spacing(1), 
								marginBottom: theme.spacing(1),
								justifyContent: 'center'
							}}>
								<Ionicons name={f.icon as any} size={18} color={f.color} />
								<Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '600' }]}>
									{f.label}
								</Text>
							</View>
							<Text style={[theme.font.h4, { fontWeight: '700', color: theme.colors.text, textAlign: 'center' }]}>
								{f.value}
							</Text>
						</View>
					))}
				</View>
			</View>

			{/* Orders Section */}
			<View style={{ 
				backgroundColor: 'white', 
				borderRadius: 20, 
				borderWidth: 1, 
				borderColor: theme.colors.borderLight, 
				padding: theme.spacing(3),
				...theme.shadow.card,
			}}>
				<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) }}>
					<View style={{
						backgroundColor: theme.colors.warningSoft,
						borderRadius: 10,
						padding: theme.spacing(1),
						marginRight: theme.spacing(1.5),
					}}>
						<Ionicons name="receipt" size={20} color={theme.colors.warning} />
					</View>
					<Text style={[theme.font.h4, { color: theme.colors.text }]}>
						Pedidos recentes
					</Text>
					<View style={{
						backgroundColor: theme.colors.accentSoft,
						paddingHorizontal: theme.spacing(1),
						paddingVertical: theme.spacing(0.5),
						borderRadius: theme.radii.full,
						marginLeft: 'auto',
					}}>
						<Text style={[theme.font.labelSmall, { color: theme.colors.accent, fontWeight: '700' }]}>
							{orders.length}
						</Text>
					</View>
				</View>
				{orders.length > 0 ? (
					<View style={{ gap: theme.spacing(2) }}>
						{orders.slice(0, 3).map((o) => (
							<View key={o.id} style={{ 
								padding: theme.spacing(2), 
								backgroundColor: theme.colors.neutralSoft,
								borderRadius: 16,
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
							}}>
								<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(0.5) }}>
									<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
										Pedido #{o.id}
									</Text>
									<View style={{
										backgroundColor: o.status === 'Entregue' ? theme.colors.positiveSoft : 
													   o.status === 'Enviado' ? theme.colors.infoSoft : 
													   theme.colors.warningSoft,
										paddingHorizontal: theme.spacing(1),
										paddingVertical: theme.spacing(0.25),
										borderRadius: theme.radii.xs,
									}}>
										<Text style={[theme.font.labelSmall, { 
											color: o.status === 'Entregue' ? theme.colors.positive : 
												   o.status === 'Enviado' ? theme.colors.info : 
												   theme.colors.warning,
											fontWeight: '700'
										}]}>
											{o.status}
										</Text>
									</View>
								</View>
								<Text style={[theme.font.bodySmall, { color: theme.colors.subtext }]}>
									{o.items.length} {o.items.length === 1 ? 'item' : 'itens'}
								</Text>
							</View>
						))}
					</View>
				) : (
					<View style={{ 
						alignItems: 'center', 
						padding: theme.spacing(3),
						backgroundColor: theme.colors.neutralSoft,
						borderRadius: 16,
					}}>
						<Ionicons name="receipt-outline" size={32} color={theme.colors.subtext} />
						<Text style={[theme.font.body, { color: theme.colors.subtext, marginTop: theme.spacing(1) }]}>
							Nenhum pedido ainda
						</Text>
					</View>
				)}
			</View>

			{/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: theme.spacing(2) }}>
                    <View style={{ flex: 1 }}>
					<AnimatedButton 
						title="Suporte" 
						onPress={() => navigation.navigate('Suporte')}
						variant="outline"
						icon="chatbubbles"
					/>
				</View>
				<View style={{ flex: 1 }}>
					<AnimatedButton 
						title="Configurações" 
						onPress={() => navigation.navigate('Configurações')}
						variant="outline"
						icon="settings"
					/>
				</View>
			</View>

			{/* Logout Button */}
			<View style={{ marginTop: theme.spacing(2) }}>
				<AnimatedButton 
					title="Sair da Conta" 
					onPress={logout}
					variant="secondary"
					fullWidth
					icon="log-out"
				/>
			</View>

			{/* Favorites section */}
			<View style={{ 
				backgroundColor: 'white', 
				borderRadius: theme.radii.xl, 
				borderWidth: 1, 
				borderColor: theme.colors.borderLight, 
				padding: theme.spacing(4),
				...theme.shadow.card,
				alignItems: 'center',
			}}>
				<View style={{ 
					flexDirection: 'row', 
					alignItems: 'center', 
					marginBottom: theme.spacing(3),
					justifyContent: 'center',
					width: '100%'
				}}>
					<View style={{
						backgroundColor: theme.colors.accentSoft,
						borderRadius: theme.radii.full,
						padding: theme.spacing(2),
						marginRight: theme.spacing(2),
						...theme.shadow.button,
					}}>
						<Ionicons name="heart" size={24} color={theme.colors.accent} />
					</View>
					<Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '800' }]}>
						Meus Favoritos
					</Text>
					<View style={{
						backgroundColor: theme.colors.accent,
						paddingHorizontal: theme.spacing(2),
						paddingVertical: theme.spacing(1),
						borderRadius: theme.radii.full,
						marginLeft: theme.spacing(2),
						...theme.shadow.button,
					}}>
						<Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
							{favItems.length}
						</Text>
					</View>
				</View>
					{favItems.length > 0 ? (
						<>
							<View style={{ 
								alignItems: 'center',
								width: '100%',
								marginBottom: theme.spacing(2)
							}}>
								<FlatList
									data={favItems.slice(0, limit)}
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{ 
										gap: theme.spacing(3),
										paddingHorizontal: theme.spacing(2),
										alignItems: 'center',
										justifyContent: 'center',
										flexGrow: 1
									}}
									renderItem={({ item }) => (
										<View style={{ 
											width: 400,
											alignItems: 'center',
											justifyContent: 'center'
										}}>
											<ProductCard product={item} onPress={() => {}} onAdd={() => {}} />
										</View>
									)}
									keyExtractor={(it) => String(it.id)}
								/>
							</View>
							{favItems.length > limit ? (
								<View style={{ 
									alignItems: 'center',
									width: '100%',
									marginTop: theme.spacing(2)
								}}>
									<Pressable 
										onPress={() => setLimit((n) => n + 10)} 
										style={{ 
											backgroundColor: theme.colors.accent,
											paddingHorizontal: theme.spacing(4),
											paddingVertical: theme.spacing(2),
											borderRadius: theme.radii.full,
											flexDirection: 'row',
											alignItems: 'center',
											gap: theme.spacing(1.5),
											...theme.shadow.button,
											minWidth: 200,
											justifyContent: 'center'
										}}
									>
										<Ionicons name="add" size={18} color="white" />
										<Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
											Ver mais favoritos
										</Text>
									</Pressable>
								</View>
							) : null}
						</>
				) : (
					<View style={{ 
						alignItems: 'center', 
						padding: theme.spacing(5),
						backgroundColor: theme.colors.accentSoft,
						borderRadius: theme.radii.xl,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
						...theme.shadow.card,
						width: '100%',
					}}>
						<View style={{
							backgroundColor: theme.colors.accent,
							borderRadius: theme.radii.full,
							padding: theme.spacing(3),
							marginBottom: theme.spacing(3),
							...theme.shadow.button,
						}}>
							<Ionicons name="heart" size={40} color="white" />
						</View>
						<Text style={[theme.font.h3, { color: theme.colors.text, marginBottom: theme.spacing(1), textAlign: 'center', fontWeight: '800' }]}>
							Nenhum favorito ainda
						</Text>
						<Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', lineHeight: 22 }]}>
							Explore produtos incríveis e adicione aos seus favoritos para acessá-los facilmente
						</Text>
					</View>
				)}
				</View>
        </View>
		</View>
	</AnimatedScreen>
	);
}
