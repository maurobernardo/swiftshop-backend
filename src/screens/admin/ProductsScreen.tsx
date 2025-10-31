import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, FlatList, Modal, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView, Image, Pressable, Animated } from 'react-native';
import { Product } from '../../types';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../../api/products';
import { theme } from '../../theme';
import AnimatedButton from '../../components/AnimatedButton';
import Chip from '../../components/Chip';
import Screen from '../../components/Screen';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadImageAsync } from '../../api/uploads';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORY_MAP = {
	Vestuário: {
		Sapato: ['marca', 'tamanho', 'cor', 'preco_promocional'],
		Camisa: ['marca', 'tamanho', 'cor', 'estilo'],
		Camiseta: ['marca', 'tamanho', 'cor', 'estampa'],
		Calça: ['marca', 'tamanho', 'cor', 'estilo'],
	},
	Tecnologia: {
		Computador: ['marca', 'referencia', 'armazenamento', 'ram', 'tipo_memoria'],
		Laptop: ['marca', 'referencia', 'armazenamento', 'ram', 'tipo_memoria'],
		Telefone: ['marca', 'referencia', 'armazenamento', 'ram'],
	},
} as const;

type MainCategory = keyof typeof CATEGORY_MAP;

// Função para converter nome da cor para hex
const getColorHex = (colorName: string): string => {
	const colorMap: Record<string, string> = {
		'Preto': '#000000',
		'Branco': '#FFFFFF',
		'Azul': '#3B82F6',
		'Vermelho': '#EF4444',
		'Verde': '#22C55E',
		'Amarelo': '#F59E0B',
		'Rosa': '#EC4899',
		'Roxo': '#8B5CF6',
		'Cinza': '#6B7280',
		'Marrom': '#92400E',
		'Laranja': '#F97316',
		'Bege': '#F3E8FF',
		'Prata': '#9CA3AF',
		'Dourado': '#F59E0B',
	};
	return colorMap[colorName] || '#6B7280';
};

export default function ProductsScreen() {
	const [items, setItems] = useState<Product[]>([]);
	const [loading, setLoading] = useState(false);
	const [modal, setModal] = useState(false);
	const [form, setForm] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, description: '', category: '', image_url: '', main_category: 'Vestuário', sub_category: 'Sapato', attributes: {}, size_images: {}, size_colors: {}, size_stock: {} });
	const [editing, setEditing] = useState<Product | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadingSizeImage, setUploadingSizeImage] = useState<string | null>(null);
	
	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	const subcategories = useMemo(() => CATEGORY_MAP[(form.main_category as MainCategory) || 'Vestuário'], [form.main_category]);
	const attributeKeys = useMemo(() => {
		const sc = (form.sub_category as keyof typeof subcategories) || Object.keys(subcategories)[0];
		return (subcategories as any)?.[sc] || [];
	}, [subcategories, form.sub_category]);

	const sizePresets = useMemo(() => {
		const sc = String(form.sub_category);
		if (sc === 'Sapato') return ['37','38','39','40','41','42','43','44'];
		if (sc === 'Camisa' || sc === 'Camiseta') return ['PP','P','M','G','GG'];
		if (sc === 'Calça') return ['36','38','40','42','44','46'];
		return [] as string[];
	}, [form.sub_category]);

	const colorOptions = [
		'Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Rosa', 'Roxo',
		'Laranja', 'Marrom', 'Cinza', 'Bege', 'Prata', 'Dourado', 'Coral', 'Turquesa'
	];

	const parseSizes = (text: string | undefined) => {
		if (!text) return [] as string[];
		const t = String(text).trim();
		const csv = t.split(',').map((s) => s.trim()).filter(Boolean);
		if (csv.length > 1) return csv;
		const m = t.match(/^(\d{2})\s*-\s*(\d{2})$/);
		if (m) {
			const a = parseInt(m[1], 10); const b = parseInt(m[2], 10);
			if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
				return Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
			}
		}
		return csv.length ? csv : (t ? [t] : []);
	};

	const toggleSizeIntoField = (value: string) => {
		setForm((f) => {
			const current = String((f.attributes as any)?.tamanho || '');
			const arr = new Set(parseSizes(current));
			if (arr.has(value)) { arr.delete(value); } else { arr.add(value); }
			const next = Array.from(arr);
			return { ...f, attributes: { ...(f.attributes || {}), tamanho: next.join(',') } };
		});
	};

	const refresh = async () => {
		setLoading(true);
		try {
			setItems(await listProducts());
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { refresh(); }, []);
	
	// Initial animation
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
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permissão necessária', 'Conceda acesso às fotos para selecionar uma imagem.');
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({ 
			mediaTypes: ImagePicker.MediaTypeOptions.Images, 
			quality: 0.7,
			allowsMultipleSelection: true,
			selectionLimit: 10
		});
		if (!result.canceled) {
			try {
				setUploading(true);
				const uris = result.assets.map(asset => asset.uri);
				const uploadPromises = uris.map(uri => uploadImageAsync(uri));
				const urls = await Promise.all(uploadPromises);
				
				const currentImages = (form.attributes as any)?.image_urls || [];
				const newImages = [...currentImages, ...urls];
				
				setForm((f) => ({ 
					...f, 
					image_url: newImages[0] || f.image_url,
					attributes: { 
						...(f.attributes || {}), 
						image_urls: newImages 
					} 
				}));
			} catch (e: any) {
				Alert.alert('Upload', 'Falha ao enviar imagens');
			} finally {
				setUploading(false);
			}
		}
	};

	const pickSizeImage = async (size: string) => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permissão necessária', 'Conceda acesso às fotos para selecionar uma imagem.');
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({ 
			mediaTypes: ImagePicker.MediaTypeOptions.Images, 
			quality: 0.7,
			allowsMultipleSelection: true,
			selectionLimit: 10
		});
		if (!result.canceled && result.assets.length > 0) {
			try {
				setUploadingSizeImage(size);
				const uploadPromises = result.assets.map(asset => uploadImageAsync(asset.uri));
				const urls = await Promise.all(uploadPromises);
				
				const currentImages = (form.size_images as any)?.[size] || [];
				const newImages = [...currentImages, ...urls];
				
				setForm((f) => ({ 
					...f, 
					size_images: { 
						...(f.size_images || {}), 
						[size]: newImages 
					} 
				}));
			} catch (e: any) {
				Alert.alert('Upload', 'Falha ao enviar imagens');
			} finally {
				setUploadingSizeImage(null);
			}
		}
	};

	const save = async () => {
		try {
			const imgs: string[] = (form.attributes as any)?.image_urls || [];
			const payload = { 
				...form, 
				image_url: imgs[0] || form.image_url,
				image_urls: imgs,
				size_images: form.size_images,
				size_colors: form.size_colors,
				attributes: { 
					...(form.attributes || {}), 
					image_urls: imgs 
				} 
			} as any;
			if (editing) {
				await updateProduct(editing.id, payload);
			} else {
				await createProduct({ id: 0, ...payload });
			}
			setModal(false);
			setEditing(null);
			setForm({ name: '', price: 0, stock: 0, description: '', category: '', image_url: '', main_category: 'Vestuário', sub_category: 'Sapato', attributes: {}, size_images: {}, size_colors: {} });
			await refresh();
			Alert.alert('Sucesso', 'Produto salvo com sucesso!');
		} catch (e: any) {
			Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao salvar');
		}
	};

	const onDelete = async (id: number) => {
		try {
			await deleteProduct(id);
			await refresh();
			Alert.alert('Excluído', 'Produto removido');
		} catch (e: any) {
			Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao excluir');
		}
	};

	const inputStyle = { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12, color: theme.colors.primary } as const;
	const selectStyle = { ...inputStyle } as const;

	return (
		<Animated.View style={{ 
			flex: 1, 
			backgroundColor: theme.colors.background,
			opacity: fadeAnim,
			transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
		}}>
			<Screen title="Produtos" right={
				<Pressable 
					onPress={() => { 
						setEditing(null); 
						setForm({ name: '', price: 0, stock: 0, description: '', category: '', image_url: '', main_category: 'Vestuário', sub_category: 'Sapato', attributes: {} }); 
						setModal(true); 
					}}
					style={{
						backgroundColor: theme.colors.accent,
						borderRadius: theme.radii.full,
						paddingHorizontal: theme.spacing(3),
						paddingVertical: theme.spacing(1.5),
						flexDirection: 'row',
						alignItems: 'center',
						gap: theme.spacing(1),
						...theme.shadow.button,
					}}
				>
					<Ionicons name="add" size={16} color="white" />
					<Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
						Novo
					</Text>
				</Pressable>
			}>
				<View style={{ gap: theme.spacing(3) }}>
					{/* Products List */}
					<FlatList
						contentContainerStyle={{ paddingTop: 0, gap: theme.spacing(2) }}
						data={items}
						keyExtractor={(i) => String(i.id)}
						renderItem={({ item }) => (
							<Animated.View style={{
								backgroundColor: 'white',
								borderRadius: theme.radii.lg,
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
								padding: theme.spacing(3),
								...theme.shadow.card,
							}}>
								<View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
									{/* Product Image */}
									<View style={{
										width: 80,
										height: 80,
										backgroundColor: theme.colors.neutralSoft,
										borderRadius: theme.radii.lg,
										overflow: 'hidden',
										...theme.shadow.button,
									}}>
										{item.image_url ? (
											<Image 
												source={{ uri: item.image_url }} 
												style={{ width: '100%', height: '100%' }} 
												resizeMode="cover"
											/>
										) : (
											<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
												<Ionicons name="image-outline" size={24} color={theme.colors.subtext} />
											</View>
										)}
									</View>
									
									{/* Product Info */}
									<View style={{ flex: 1 }}>
										<Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
											{item.name}
										</Text>
										<Text style={[theme.font.body, { color: theme.colors.subtext, marginTop: theme.spacing(0.5) }]}>
											MT {item.price.toFixed(2)}
										</Text>
										<Text style={[theme.font.body, { color: theme.colors.subtext }]}>
											Estoque: {item.stock}
										</Text>
										<View style={{
											backgroundColor: theme.colors.accentSoft,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(0.5),
											borderRadius: theme.radii.full,
											alignSelf: 'flex-start',
											marginTop: theme.spacing(1),
										}}>
											<Text style={[theme.font.labelSmall, { 
												color: theme.colors.accent,
												fontWeight: '700'
											}]}>
												{item.main_category} / {item.sub_category}
											</Text>
										</View>
									</View>
								</View>
								
								{/* Action Buttons */}
								<View style={{ flexDirection: 'row', gap: theme.spacing(2), marginTop: theme.spacing(3) }}>
									<Pressable 
										onPress={() => { setEditing(item); setForm(item); setModal(true); }}
										style={{
											flex: 1,
											backgroundColor: theme.colors.accent,
											borderRadius: theme.radii.lg,
											paddingVertical: theme.spacing(2),
											paddingHorizontal: theme.spacing(3),
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'center',
											gap: theme.spacing(1),
											...theme.shadow.button,
										}}
									>
										<Ionicons name="create" size={16} color="white" />
										<Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
											Editar
										</Text>
									</Pressable>
									
									<Pressable 
										onPress={() => onDelete(item.id)}
										style={{
											backgroundColor: theme.colors.errorSoft,
											borderRadius: theme.radii.lg,
											padding: theme.spacing(2),
											...theme.shadow.button,
										}}
									>
										<Ionicons name="trash" size={16} color={theme.colors.error} />
									</Pressable>
								</View>
							</Animated.View>
						)}
						ListEmptyComponent={
							<View style={{ alignItems: 'center', padding: theme.spacing(4) }}>
								<Ionicons name="cube-outline" size={48} color={theme.colors.subtext} />
								<Text style={[theme.font.h4, { color: theme.colors.text, marginTop: theme.spacing(2), textAlign: 'center' }]}>
									Nenhum produto encontrado
								</Text>
								<Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', marginTop: theme.spacing(1) }]}>
									Adicione o primeiro produto
								</Text>
							</View>
						}
					/>
				</View>
			</Screen>
			<Modal visible={modal} animationType="slide">
				<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
					<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
						{/* Header */}
						<View style={{
							padding: theme.spacing(4),
							borderBottomWidth: 1,
							borderBottomColor: theme.colors.borderLight,
							backgroundColor: 'white',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							...theme.shadow.card,
						}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
								<View style={{
									backgroundColor: theme.colors.accent,
									borderRadius: theme.radii.full,
									padding: theme.spacing(1.5),
									...theme.shadow.button,
								}}>
									<Ionicons name="cube" size={20} color="white" />
								</View>
								<Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '800' }]}>
									{editing ? 'Editar Produto' : 'Novo Produto'}
								</Text>
							</View>
							<Pressable 
								onPress={() => setModal(false)}
								style={{
									backgroundColor: theme.colors.errorSoft,
									borderRadius: theme.radii.full,
									padding: theme.spacing(1.5),
									...theme.shadow.button,
								}}
							>
								<Ionicons name="close" size={16} color={theme.colors.error} />
							</Pressable>
						</View>

						<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: theme.spacing(3), gap: theme.spacing(3) }}>
							{/* Image Section */}
							<View style={{
								backgroundColor: 'white',
								borderRadius: theme.radii.lg,
								padding: theme.spacing(3),
								...theme.shadow.card,
							}}>
								<Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
									Imagem do Produto
								</Text>
								<Pressable 
									onPress={pickImage} 
									style={{ 
										backgroundColor: theme.colors.neutralSoft, 
										borderWidth: 2, 
										borderColor: theme.colors.borderLight, 
										borderRadius: theme.radii.lg, 
										padding: theme.spacing(4), 
										alignItems: 'center', 
										justifyContent: 'center',
										...theme.shadow.button,
									}}
								>
									{uploading ? (
										<View style={{ alignItems: 'center', gap: theme.spacing(2) }}>
											<Ionicons name="cloud-upload" size={32} color={theme.colors.accent} />
											<Text style={[theme.font.body, { color: theme.colors.accent, fontWeight: '700' }]}>
												Enviando imagem...
											</Text>
										</View>
									) : form.image_url ? (
										<Image 
											source={{ uri: String(form.image_url) }} 
											style={{ width: '100%', height: 200, borderRadius: theme.radii.lg }} 
										/>
									) : (
										<View style={{ alignItems: 'center', gap: theme.spacing(2) }}>
											<Ionicons name="image" size={32} color={theme.colors.accent} />
											<Text style={[theme.font.body, { color: theme.colors.accent, fontWeight: '700' }]}>
												Selecionar imagem
											</Text>
										</View>
									)}
								</Pressable>
							</View>

							{/* Gallery controls */}
							{Array.isArray((form.attributes as any)?.image_urls) && (form.attributes as any).image_urls.length ? (
								<View style={{
									backgroundColor: 'white',
									borderRadius: theme.radii.lg,
									padding: theme.spacing(3),
									...theme.shadow.card,
								}}>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(2) }}>
										<Text style={[theme.font.h4, { color: theme.colors.text }]}>
											Galeria de Imagens ({((form.attributes as any).image_urls as string[]).length})
										</Text>
										<Pressable 
											onPress={pickImage}
											style={{
												backgroundColor: theme.colors.accent,
												borderRadius: theme.radii.full,
												paddingHorizontal: theme.spacing(2),
												paddingVertical: theme.spacing(1),
												flexDirection: 'row',
												alignItems: 'center',
												gap: theme.spacing(1),
												...theme.shadow.button,
											}}
										>
											<Ionicons name="add" size={14} color="white" />
											<Text style={[theme.font.labelSmall, { color: 'white', fontWeight: '700' }]}>
												Adicionar
											</Text>
										</Pressable>
									</View>
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing(2) }}>
										{((form.attributes as any).image_urls as string[]).map((u, i) => (
											<View key={u + String(i)} style={{ position: 'relative' }}>
												<Image source={{ uri: u }} style={{ width: 80, height: 60, borderRadius: theme.radii.lg }} />
												<View style={{ position: 'absolute', right: 4, top: 4, flexDirection: 'row', gap: 4 }}>
													{form.image_url !== u && (
														<Pressable 
															onPress={() => setForm((f) => ({ ...f, image_url: u }))} 
															style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radii.sm }}
														>
															<Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>Capa</Text>
														</Pressable>
													)}
													{form.image_url === u && (
														<View style={{ backgroundColor: 'rgba(34,197,94,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radii.sm }}>
															<Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>✓</Text>
														</View>
													)}
													<Pressable 
														onPress={() => {
															const newImages = ((form.attributes as any)?.image_urls || []).filter((x: string, idx: number) => idx !== i);
															setForm((f) => ({ 
																...f, 
																image_url: newImages[0] || '',
																attributes: { ...(f.attributes || {}), image_urls: newImages } 
															}));
														}} 
														style={{ backgroundColor: 'rgba(220,38,38,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radii.sm }}
													>
														<Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>×</Text>
													</Pressable>
												</View>
											</View>
										))}
									</ScrollView>
								</View>
							) : null}

							{/* Basic Information */}
							<View style={{
								backgroundColor: 'white',
								borderRadius: theme.radii.lg,
								padding: theme.spacing(3),
								...theme.shadow.card,
							}}>
								<Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
									Informações Básicas
								</Text>
								
								<View style={{ gap: theme.spacing(3) }}>
									<View>
										<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
											Nome do Produto
										</Text>
										<TextInput 
											placeholder="Digite o nome do produto" 
											value={String(form.name || '')} 
											onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} 
											style={{
												backgroundColor: theme.colors.neutralSoft,
												borderWidth: 1,
												borderColor: theme.colors.borderLight,
												borderRadius: theme.radii.lg,
												padding: theme.spacing(3),
												...theme.font.body,
												color: theme.colors.text,
											}} 
											placeholderTextColor={theme.colors.subtext} 
										/>
									</View>

									<View style={{ flexDirection: 'row', gap: theme.spacing(2) }}>
										<View style={{ flex: 1 }}>
											<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
												Preço (MT)
											</Text>
											<TextInput 
												placeholder="0.00" 
												keyboardType="decimal-pad" 
												value={String(form.price ?? '')} 
												onChangeText={(t) => setForm((f) => ({ ...f, price: Number(t) }))} 
												style={{
													backgroundColor: theme.colors.neutralSoft,
													borderWidth: 1,
													borderColor: theme.colors.borderLight,
													borderRadius: theme.radii.lg,
													padding: theme.spacing(3),
													...theme.font.body,
													color: theme.colors.text,
												}} 
												placeholderTextColor={theme.colors.subtext} 
											/>
										</View>
										<View style={{ flex: 1 }}>
											<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
												Estoque
											</Text>
											<TextInput 
												placeholder="0" 
												keyboardType="number-pad" 
												value={String(form.stock ?? '')} 
												onChangeText={(t) => setForm((f) => ({ ...f, stock: Number(t) }))} 
												style={{
													backgroundColor: theme.colors.neutralSoft,
													borderWidth: 1,
													borderColor: theme.colors.borderLight,
													borderRadius: theme.radii.lg,
													padding: theme.spacing(3),
													...theme.font.body,
													color: theme.colors.text,
												}} 
												placeholderTextColor={theme.colors.subtext} 
											/>
										</View>
									</View>

									<View>
										<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
											Descrição
										</Text>
										<TextInput 
											placeholder="Descreva o produto" 
											value={String(form.description || '')} 
											onChangeText={(t) => setForm((f) => ({ ...f, description: t }))} 
											multiline
											numberOfLines={3}
											style={{
												backgroundColor: theme.colors.neutralSoft,
												borderWidth: 1,
												borderColor: theme.colors.borderLight,
												borderRadius: theme.radii.lg,
												padding: theme.spacing(3),
												...theme.font.body,
												color: theme.colors.text,
												minHeight: 80,
											}} 
											placeholderTextColor={theme.colors.subtext} 
										/>
									</View>
								</View>
							</View>

							{/* Categories */}
							<View style={{
								backgroundColor: 'white',
								borderRadius: theme.radii.lg,
								padding: theme.spacing(3),
								...theme.shadow.card,
							}}>
								<Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
									Categorias
								</Text>
								
								<View style={{ gap: theme.spacing(3) }}>
									<View>
										<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
											Categoria Principal
										</Text>
										<View style={{ flexDirection: 'row', gap: theme.spacing(2), flexWrap: 'wrap' }}>
											{(Object.keys(CATEGORY_MAP) as MainCategory[]).map((m) => (
												<Pressable
													key={m}
													onPress={() => setForm((f) => ({ ...f, main_category: m, sub_category: Object.keys(CATEGORY_MAP[m])[0], attributes: {} }))}
													style={{
														paddingHorizontal: theme.spacing(3),
														paddingVertical: theme.spacing(1.5),
														borderRadius: theme.radii.full,
														borderWidth: 1,
														borderColor: form.main_category === m ? theme.colors.accent : theme.colors.borderLight,
														backgroundColor: form.main_category === m ? theme.colors.accentSoft : 'white',
														...theme.shadow.button,
													}}
												>
													<Text style={[theme.font.labelSmall, { 
														color: form.main_category === m ? theme.colors.accent : theme.colors.subtext,
														fontWeight: '700'
													}]}>
														{m}
													</Text>
												</Pressable>
											))}
										</View>
									</View>

									<View>
										<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
											Subcategoria
										</Text>
										<View style={{ flexDirection: 'row', gap: theme.spacing(2), flexWrap: 'wrap' }}>
											{(Object.keys(subcategories) as string[]).map((s) => (
												<Pressable
													key={s}
													onPress={() => setForm((f) => ({ ...f, sub_category: s, attributes: {} }))}
													style={{
														paddingHorizontal: theme.spacing(3),
														paddingVertical: theme.spacing(1.5),
														borderRadius: theme.radii.full,
														borderWidth: 1,
														borderColor: form.sub_category === s ? theme.colors.accent : theme.colors.borderLight,
														backgroundColor: form.sub_category === s ? theme.colors.accentSoft : 'white',
														...theme.shadow.button,
													}}
												>
													<Text style={[theme.font.labelSmall, { 
														color: form.sub_category === s ? theme.colors.accent : theme.colors.subtext,
														fontWeight: '700'
													}]}>
														{s}
													</Text>
												</Pressable>
											))}
										</View>
									</View>
								</View>
							</View>

							{/* Attributes */}
							{attributeKeys.length > 0 && (
								<View style={{
									backgroundColor: 'white',
									borderRadius: theme.radii.lg,
									padding: theme.spacing(3),
									...theme.shadow.card,
								}}>
									<Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
										Atributos Específicos
									</Text>
									
									<View style={{ gap: theme.spacing(3) }}>
										{attributeKeys.map((k) => {
											const isSize = k === 'tamanho';
											return (
												<View key={k}>
													{isSize ? (
														<>
															<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
																Tamanhos
															</Text>
															<TextInput
																placeholder="Digite os tamanhos (ex: 37,38,39 ou 37-41)"
																value={String((form.attributes as any)?.tamanho || '')}
																onChangeText={(t) => setForm((f) => ({ ...f, attributes: { ...(f.attributes || {}), tamanho: t } }))}
																style={{
																	backgroundColor: theme.colors.neutralSoft,
																	borderWidth: 1,
																	borderColor: theme.colors.borderLight,
																	borderRadius: theme.radii.lg,
																	padding: theme.spacing(3),
																	...theme.font.body,
																	color: theme.colors.text,
																}}
																placeholderTextColor={theme.colors.subtext}
															/>
															{sizePresets.length ? (
																<View style={{ marginTop: theme.spacing(2), gap: theme.spacing(2) }}>
																	<Text style={[theme.font.label, { color: theme.colors.subtext }]}>
																		Sugestões de Tamanhos
																	</Text>
																	<View style={{ flexDirection: 'row', gap: theme.spacing(2), flexWrap: 'wrap' }}>
																		{sizePresets.map((v) => (
																			<Pressable
																				key={v}
																				onPress={() => toggleSizeIntoField(v)}
																				style={{
																					paddingHorizontal: theme.spacing(2),
																					paddingVertical: theme.spacing(1),
																					borderRadius: theme.radii.full,
																					borderWidth: 1,
																					borderColor: parseSizes(String((form.attributes as any)?.tamanho)).includes(v) ? theme.colors.accent : theme.colors.borderLight,
																					backgroundColor: parseSizes(String((form.attributes as any)?.tamanho)).includes(v) ? theme.colors.accentSoft : 'white',
																					...theme.shadow.button,
																				}}
																			>
																				<Text style={[theme.font.labelSmall, { 
																					color: parseSizes(String((form.attributes as any)?.tamanho)).includes(v) ? theme.colors.accent : theme.colors.subtext,
																					fontWeight: '700'
																				}]}>
																					{v}
																				</Text>
																			</Pressable>
																		))}
																	</View>
																</View>
															) : null}
														</>
													) : (
														<View>
															<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
																{k.charAt(0).toUpperCase() + k.slice(1)}
															</Text>
															<TextInput 
																placeholder={`Digite ${k}`} 
																value={String((form.attributes as any)?.[k] || '')} 
																onChangeText={(t) => setForm((f) => ({ ...f, attributes: { ...(f.attributes || {}), [k]: t } }))} 
																style={{
																	backgroundColor: theme.colors.neutralSoft,
																	borderWidth: 1,
																	borderColor: theme.colors.borderLight,
																	borderRadius: theme.radii.lg,
																	padding: theme.spacing(3),
																	...theme.font.body,
																	color: theme.colors.text,
																}} 
																placeholderTextColor={theme.colors.subtext} 
															/>
														</View>
													)}
												</View>
											);
										})}
									</View>
								</View>
							)}

							{/* Size Images Section - For shoes, shirts, t-shirts and pants */}
							{(form.sub_category === 'Sapato' || form.sub_category === 'Camisa' || form.sub_category === 'Camiseta' || form.sub_category === 'Calça') && sizePresets.length > 0 && (
								<View style={{
									backgroundColor: 'white',
									borderRadius: theme.radii.lg,
									padding: theme.spacing(3),
									...theme.shadow.card,
								}}>
									<Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
										Fotos, Cores e Estoque por Tamanho
									</Text>
									<Text style={[theme.font.body, { color: theme.colors.subtext, marginBottom: theme.spacing(3) }]}>
										Adicione fotos, cores e estoque específicos para cada tamanho disponível
									</Text>
									
									<View style={{ gap: theme.spacing(3) }}>
										{sizePresets.map((size) => {
											const currentSizeImages = (form.size_images as any)?.[size] || [];
											const currentSizeColors = (form.size_colors as any)?.[size] || [];
											const isUploading = uploadingSizeImage === size;
											
											return (
												<View key={size} style={{
													borderWidth: 1,
													borderColor: theme.colors.borderLight,
													borderRadius: theme.radii.lg,
													padding: theme.spacing(2),
												}}>
													<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing(2) }}>
														<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
															Tamanho {size}
														</Text>
														<Pressable 
															onPress={() => pickSizeImage(size)}
															disabled={isUploading}
															style={{
																backgroundColor: theme.colors.accent,
																borderRadius: theme.radii.full,
																paddingHorizontal: theme.spacing(2),
																paddingVertical: theme.spacing(1),
																flexDirection: 'row',
																alignItems: 'center',
																gap: theme.spacing(1),
																opacity: isUploading ? 0.6 : 1,
																...theme.shadow.button,
															}}
														>
															{isUploading ? (
																<Ionicons name="cloud-upload" size={14} color="white" />
															) : (
																<Ionicons name="camera" size={14} color="white" />
															)}
															<Text style={[theme.font.labelSmall, { color: 'white', fontWeight: '700' }]}>
																{isUploading ? 'Enviando...' : currentSizeImages.length > 0 ? `Adicionar (${currentSizeImages.length})` : 'Adicionar'}
															</Text>
														</Pressable>
													</View>
													
													{/* Multiple Colors Selection */}
													<View style={{ marginBottom: theme.spacing(2) }}>
														<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
															Cores do Tamanho {size}
														</Text>
														<Text style={[theme.font.labelSmall, { color: theme.colors.subtext, marginBottom: theme.spacing(2) }]}>
															Toque para selecionar/deselecionar múltiplas cores
														</Text>
														<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing(1.5) }}>
															{colorOptions.map((color) => {
																const isSelected = currentSizeColors.includes(color);
																return (
																	<Pressable
																		key={color}
																		onPress={() => {
																			const newColors = isSelected 
																				? currentSizeColors.filter((c: string) => c !== color)
																				: [...currentSizeColors, color];
																			setForm((f) => ({ 
																				...f, 
																				size_colors: { 
																					...(f.size_colors as any || {}), 
																					[size]: newColors
																				} 
																			}));
																		}}
																		style={{
																			paddingHorizontal: theme.spacing(2),
																			paddingVertical: theme.spacing(1),
																			borderRadius: theme.radii.full,
																			borderWidth: 2,
																			borderColor: isSelected ? theme.colors.accent : theme.colors.borderLight,
																			backgroundColor: isSelected ? theme.colors.accentSoft : 'white',
																			...theme.shadow.button,
																		}}
																	>
																		<Text style={[theme.font.labelSmall, { 
																			color: isSelected ? theme.colors.accent : theme.colors.subtext,
																			fontWeight: '700'
																		}]}>
																			{color}
																		</Text>
																	</Pressable>
																);
															})}
														</ScrollView>
														{currentSizeColors.length > 0 && (
															<View style={{ marginTop: theme.spacing(2) }}>
																<Text style={[theme.font.labelSmall, { color: theme.colors.accent, fontWeight: '600', marginBottom: theme.spacing(1) }]}>
																	Cores selecionadas ({currentSizeColors.length}):
																</Text>
																<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) }}>
																	{currentSizeColors.map((color: string) => (
																		<View key={color} style={{
																			flexDirection: 'row',
																			alignItems: 'center',
																			backgroundColor: theme.colors.accentSoft,
																			paddingHorizontal: theme.spacing(2),
																			paddingVertical: theme.spacing(1),
																			borderRadius: theme.radii.full,
																			gap: theme.spacing(1),
																		}}>
																			<View style={{
																				width: 12,
																				height: 12,
																				borderRadius: 6,
																				backgroundColor: getColorHex(color),
																				borderWidth: 1,
																				borderColor: theme.colors.accent,
																			}} />
																			<Text style={[theme.font.labelSmall, { color: theme.colors.accent, fontWeight: '700' }]}>
																				{color}
																			</Text>
																		</View>
																	))}
																</View>
															</View>
														)}
													</View>
													
													{/* Stock per Size */}
													<View style={{ marginBottom: theme.spacing(2) }}>
														<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
															Estoque do Tamanho {size}
														</Text>
														<TextInput
															value={String((form.size_stock as any)?.[size] || '')}
															onChangeText={(text) => {
																const numValue = parseInt(text) || 0;
																setForm((f) => ({ 
																	...f, 
																	size_stock: { 
																		...(f.size_stock as any || {}), 
																		[size]: numValue 
																	} 
																}));
															}}
															placeholder="Quantidade disponível"
															keyboardType="numeric"
															style={{
																borderWidth: 1,
																borderColor: theme.colors.borderLight,
																borderRadius: theme.radii.md,
																paddingHorizontal: theme.spacing(2),
																paddingVertical: theme.spacing(2),
																backgroundColor: 'white',
																color: theme.colors.text,
																fontSize: 14,
															}}
														/>
														{(form.size_stock as any)?.[size] && (form.size_stock as any)[size] > 0 && (
															<Text style={[theme.font.labelSmall, { color: theme.colors.success, marginTop: theme.spacing(1), fontWeight: '600' }]}>
																✓ {(form.size_stock as any)[size]} unidade{(form.size_stock as any)[size] > 1 ? 's' : ''} disponível{(form.size_stock as any)[size] > 1 ? 's' : ''}
															</Text>
														)}
													</View>
													
													{currentSizeImages.length > 0 ? (
														<View>
															<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing(2) }}>
																{currentSizeImages.map((imageUrl: string, index: number) => (
																	<View key={imageUrl + index} style={{ position: 'relative' }}>
																		<Image 
																			source={{ uri: imageUrl }} 
																			style={{ 
																				width: 120, 
																				height: 120, 
																				borderRadius: theme.radii.md,
																				backgroundColor: theme.colors.neutralSoft
																			}} 
																			resizeMode="cover"
																		/>
																		<Pressable 
																			onPress={() => setForm((f) => {
																				const newSizeImages = { ...(f.size_images as any) };
																				const filteredImages = newSizeImages[size].filter((_: any, i: number) => i !== index);
																				if (filteredImages.length === 0) {
																					delete newSizeImages[size];
																				} else {
																					newSizeImages[size] = filteredImages;
																				}
																				return { ...f, size_images: newSizeImages };
																			})}
																			style={{
																				position: 'absolute',
																				top: 8,
																				right: 8,
																				backgroundColor: 'rgba(220,38,38,0.8)',
																				borderRadius: theme.radii.full,
																				padding: theme.spacing(1),
																				...theme.shadow.button,
																			}}
																		>
																			<Ionicons name="trash" size={12} color="white" />
																		</Pressable>
																	</View>
																))}
															</ScrollView>
															<Text style={[theme.font.labelSmall, { color: theme.colors.subtext, marginTop: theme.spacing(1), textAlign: 'center' }]}>
																{currentSizeImages.length} foto{currentSizeImages.length > 1 ? 's' : ''} para o tamanho {size}
															</Text>
														</View>
													) : (
														<View style={{
															backgroundColor: theme.colors.neutralSoft,
															borderWidth: 2,
															borderColor: theme.colors.borderLight,
															borderStyle: 'dashed',
															borderRadius: theme.radii.lg,
															height: 120,
															alignItems: 'center',
															justifyContent: 'center',
															gap: theme.spacing(1),
														}}>
															<Ionicons name="image-outline" size={24} color={theme.colors.subtext} />
															<Text style={[theme.font.labelSmall, { color: theme.colors.subtext }]}>
																Nenhuma foto para este tamanho
															</Text>
														</View>
													)}
												</View>
											);
										})}
									</View>
								</View>
							)}

						{/* Action Buttons */}
						<View style={{ flexDirection: 'row', gap: theme.spacing(2), marginTop: theme.spacing(2) }}>
							<View style={{ flex: 1 }}>
								<AnimatedButton title="Salvar Produto" onPress={save} fullWidth />
							</View>
							<View style={{ flex: 1 }}>
								<Pressable
										onPress={() => setModal(false)}
										style={{
											backgroundColor: theme.colors.neutralSoft,
											borderRadius: theme.radii.lg,
											padding: theme.spacing(3),
											alignItems: 'center',
											borderWidth: 1,
											borderColor: theme.colors.borderLight,
											...theme.shadow.button,
										}}
									>
										<Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '700' }]}>
											Cancelar
										</Text>
									</Pressable>
								</View>
							</View>
						</ScrollView>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</Animated.View>
	);
}
