import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View, Image, ScrollView, Pressable, Modal, Platform, PanResponder, GestureResponderEvent, PanResponderGestureState, TextInput } from 'react-native';
import { Animated, Easing } from 'react-native';
import { getProduct, listReviews, createReview, Review } from '../../api/products';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { theme } from '../../theme';
import Chip from '../../components/Chip';
import AnimatedButton from '../../components/AnimatedButton';
import AnimatedCard from '../../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { getFullImageUrl } from '../../utils/imageUtils';
function friendlyLabel(key: string): string {
	const map: Record<string, string> = {
		marca: 'Marca',
		tamanho: 'Tamanho',
		cor: 'Cor',
		estilo: 'Estilo',
		estampa: 'Estampa',
		preco_promocional: 'Preço promocional',
		referencia: 'Referência',
		armazenamento: 'Armazenamento',
		ram: 'RAM',
		tipo_memoria: 'Tipo de memória',
	};
	return map[key] || key;
}

export default function ProductDetailScreen({ route }: any) {
	const { id } = route.params as { id: number };
	const [item, setItem] = useState<Product | null>(null);
	const [loading, setLoading] = useState(false);
	const [size, setSize] = useState<string>('');
	const [selectedColor, setSelectedColor] = useState<string>('');
	const [tab, setTab] = useState<'desc' | 'reviews'>('desc');
const { addToCart } = useCart();

// Categorias de vestuário que têm tamanho e cor
const CLOTHING_CATEGORIES = ['Sapato', 'Camisa', 'Camiseta', 'Calça', 'Calca'];
const [currentIdx, setCurrentIdx] = useState(0);
const [reviews, setReviews] = useState<Review[]>([]);
const [myRating, setMyRating] = useState<number>(0);
const [myComment, setMyComment] = useState<string>('');
const [showZoom, setShowZoom] = useState(false);
const [androidZoom2x, setAndroidZoom2x] = useState(false);
const [mode360, setMode360] = useState(false);
const panAccum = useRef(0);
const panResponder = useRef(
    PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => mode360 && Math.abs(g.dx) > 6,
        onPanResponderMove: (_e: GestureResponderEvent, gesture: PanResponderGestureState) => {
            if (!mode360) return;
            panAccum.current += gesture.dx;
            const stepPx = 20; // pixels to change one frame
            while (panAccum.current >= stepPx) {
                setCurrentIdx((idx) => (idx - 1 + images.length) % images.length);
                panAccum.current -= stepPx;
            }
            while (panAccum.current <= -stepPx) {
                setCurrentIdx((idx) => (idx + 1) % images.length);
                panAccum.current += stepPx;
            }
        },
        onPanResponderRelease: () => { panAccum.current = 0; },
        onPanResponderTerminationRequest: () => true,
    })
).current;
// Fotos principais do produto (capa + galeria geral)
const mainImages = useMemo(() => {
	if (!item) return [] as string[];
	
	let imageArray: string[] = [];
	
	if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0) {
		imageArray = item.image_urls.filter(Boolean);
	} else if (item.attributes && (item.attributes as any).image_urls && Array.isArray((item.attributes as any).image_urls)) {
		imageArray = (item.attributes as any).image_urls.filter(Boolean);
	} else if (item.image_url) {
		imageArray = [item.image_url];
	}
	
	return imageArray;
}, [item]);

// Fotos específicas do tamanho selecionado (se houver)
const sizeImages = useMemo(() => {
	if (!item) return [] as string[];
	
	// Para produtos de vestuário, verificar se há fotos específicas para o tamanho selecionado
	if (CLOTHING_CATEGORIES.includes(item.sub_category || '') && size && item.size_images && item.size_images[size] && item.size_images[size].length > 0) {
		return [...item.size_images[size]];
	}
	
	return [];
}, [item, size]);

// Imagens finais a serem exibidas (prioriza fotos do tamanho se disponíveis)
const images = useMemo(() => {
	if (sizeImages.length > 0) {
		// Se há fotos específicas do tamanho, mostra apenas essas
		return sizeImages;
	} else {
		// Senão, mostra as fotos principais
		return mainImages;
	}
}, [sizeImages, mainImages]);

const has360 = images.length >= 8;

useEffect(() => { setCurrentIdx(0); }, [images.length]);

// Reset image index when size changes to show size-specific image first
useEffect(() => { setCurrentIdx(0); }, [size]);

// Auto-selecionar primeira cor quando o tamanho mudar
useEffect(() => {
	if (size && item && item.size_colors && item.size_colors[size] && item.size_colors[size].length > 0) {
		setSelectedColor(item.size_colors[size][0]);
	} else {
		setSelectedColor('');
	}
}, [size, item]);

	const sizeOptions = useMemo(() => {
		if (!item) return [] as string[];
		// 1) Buscar em atributos usando chaves comuns
		const attrs: any = item.attributes || {};
		const raw = (attrs.tamanho ?? attrs.size ?? attrs.sizes) as unknown;
		if (Array.isArray(raw)) return raw.map((v) => String(v));
		if (typeof raw === 'string') {
			const csv = raw.split(',').map((s) => s.trim()).filter(Boolean);
			if (csv.length > 1) return csv;
			const range = raw.match(/^(\d{2})\s*-\s*(\d{2})$/);
			if (range) {
				const start = parseInt(range[1], 10);
				const end = parseInt(range[2], 10);
				if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
					return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
				}
			}
			if (csv.length === 1) return csv; // único valor
		}
		if (typeof raw === 'number') return [String(raw)];
		// 2) Defaults por subcategoria (normalizada, sem acento)
		const norm = (s?: string | null) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
		switch (norm(item.sub_category)) {
			case 'sapato':
			case 'sapatos':
			case 'tenis':
				return ['37','38','39','40','41','42','43','44'];
			case 'camisa':
			case 'camiseta':
			case 'tshirt':
				return ['PP','P','M','G','GG'];
			case 'calca':
			case 'calças':
			case 'jeans':
				return ['36','38','40','42','44','46'];
			default:
				return [];
		}
	}, [item]);

	useEffect(() => {
		if (sizeOptions.length && !size) {
			setSize(sizeOptions[0]);
		}
	}, [sizeOptions.length]);

	const SizeChip = ({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) => {
		const isClothing = CLOTHING_CATEGORIES.includes(item?.sub_category || '');
		const hasSpecificImages = isClothing && item?.size_images && item.size_images[value] && item.size_images[value].length > 0;
		const imageCount = isClothing && item?.size_images && item.size_images[value] ? item.size_images[value].length : 0;
		const sizeColors = isClothing && item?.size_colors && item.size_colors[value] ? item.size_colors[value] : [];
		const sizeStock = isClothing && item?.size_stock && item.size_stock[value];
		
		// Se não há fotos específicas mas há fotos principais, mostrar ícone diferente
		const showsMainImages = !hasSpecificImages && mainImages.length > 0;
		
		return (
			<Pressable onPress={onPress} style={{
				paddingVertical: 8,
				paddingHorizontal: 12,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: selected ? theme.colors.accent : '#E5E7EB',
				backgroundColor: selected ? theme.colors.accentSoft : '#F3F4F6',
				flexDirection: 'row',
				alignItems: 'center',
				gap: 4,
			}}>
				<Text style={{ color: selected ? theme.colors.accent : '#6B7280', fontWeight: '700' }}>{value}</Text>
				{hasSpecificImages && (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
						<Ionicons name="camera" size={12} color={selected ? theme.colors.accent : '#22C55E'} />
						{imageCount > 1 && (
							<Text style={{ fontSize: 10, color: selected ? theme.colors.accent : '#22C55E', fontWeight: '700' }}>
								{imageCount}
							</Text>
						)}
					</View>
				)}
				{showsMainImages && !hasSpecificImages && (
					<Ionicons name="image" size={12} color={selected ? theme.colors.accent : '#6B7280'} />
				)}
				{sizeColors.length > 0 && (
					<View style={{ flexDirection: 'row', gap: 2 }}>
						{sizeColors.slice(0, 2).map((color, index) => (
							<View key={color + index} style={{
								width: 10,
								height: 10,
								borderRadius: 5,
								borderWidth: 1,
								borderColor: selected ? theme.colors.accent : '#E5E7EB',
								backgroundColor: getColorHex(color),
							}} />
						))}
						{sizeColors.length > 2 && (
							<View style={{
								width: 10,
								height: 10,
								borderRadius: 5,
								borderWidth: 1,
								borderColor: selected ? theme.colors.accent : '#E5E7EB',
								backgroundColor: selected ? theme.colors.accent : '#6B7280',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
								<Text style={{ fontSize: 6, color: 'white', fontWeight: '700' }}>
									+
								</Text>
							</View>
						)}
					</View>
				)}
				{sizeStock !== undefined && (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
						<Ionicons 
							name={sizeStock > 0 ? "checkmark-circle" : "close-circle"} 
							size={10} 
							color={selected ? theme.colors.accent : (sizeStock > 0 ? theme.colors.success : theme.colors.error)} 
						/>
						<Text style={{ 
							fontSize: 9, 
							color: selected ? theme.colors.accent : (sizeStock > 0 ? theme.colors.success : theme.colors.error), 
							fontWeight: '700' 
						}}>
							{sizeStock}
						</Text>
					</View>
				)}
			</Pressable>
		);
	};

	// Função para converter nome da cor para hex
	const getColorHex = (colorName: string): string => {
		const colorMap: Record<string, string> = {
			'Preto': '#000000',
			'Branco': '#FFFFFF',
			'Azul': '#3B82F6',
			'Vermelho': '#EF4444',
			'Verde': '#10B981',
			'Amarelo': '#F59E0B',
			'Rosa': '#EC4899',
			'Roxo': '#8B5CF6',
			'Laranja': '#F97316',
			'Marrom': '#92400E',
			'Cinza': '#6B7280',
			'Bege': '#F3E8FF',
			'Prata': '#9CA3AF',
			'Dourado': '#D97706',
			'Coral': '#FF7F7F',
			'Turquesa': '#14B8A6'
		};
		return colorMap[colorName] || '#6B7280';
	};

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const res = await getProduct(id);
				setItem(res);
				setReviews(await listReviews(id));
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	if (loading || !item) {
		return (
			<View style={{ flex: 1, padding: theme.spacing(2), gap: 12 }}>
				<View style={{ backgroundColor: '#F3F6FA', height: 220, borderRadius: theme.radii.lg }} />
				<View style={{ flexDirection: 'row', gap: 8 }}>
					<View style={{ flex: 1, height: 14, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
					<View style={{ width: 60, height: 14, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
				</View>
				<View style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
				<View style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 8, width: '60%' }} />
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: theme.spacing(2) }}>
                <View
                    style={{ backgroundColor: '#F3F6FA', height: 280, borderRadius: theme.radii.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                    {...(mode360 ? panResponder.panHandlers : {})}
                >
					{images.length ? (
                        <Pressable onPress={() => setShowZoom(true)} style={{ width: '100%', height: '100%' }}>
						<Image source={{ uri: getFullImageUrl(String(images[currentIdx])) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </Pressable>
					) : (
						<Ionicons name="image-outline" size={80} color={theme.colors.subtext} />
					)}
				</View>
				{/* Preview thumbs */}
                {!mode360 && images.length > 1 ? (
					<View style={{ marginTop: theme.spacing(2) }}>
						<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
							Imagens ({images.length})
						</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing(2) }}>
							{images.map((uri, i) => (
								<Pressable 
									key={String(i)} 
									onPress={() => setCurrentIdx(i)} 
									style={{ 
										width: 60, 
										height: 45, 
										borderRadius: 16, 
										overflow: 'hidden', 
										borderWidth: 2, 
										borderColor: currentIdx === i ? theme.colors.accent : theme.colors.borderLight,
										...theme.shadow.button,
									}}
								>
									<Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
								</Pressable>
							))}
						</ScrollView>
					</View>
                ) : null}

				{/* Image indicators and controls */}
				<View style={{ position: 'absolute', right: 16, top: 16, flexDirection: 'row', gap: 8 }}>
					{/* Indicador de foto específica do tamanho */}
					{sizeImages.length > 0 && currentIdx < sizeImages.length && (
						<View style={{ backgroundColor: 'rgba(34,197,94,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
							<Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
								Tamanho {size}
							</Text>
							{sizeImages.length > 1 && (
								<Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
									{currentIdx + 1}/{sizeImages.length}
								</Text>
							)}
							{item?.size_colors && item.size_colors[size] && (
								<View style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									backgroundColor: getColorHex(item.size_colors[size]),
								}} />
							)}
						</View>
					)}
					{/* Indicador de foto principal quando não há fotos específicas do tamanho */}
					{sizeImages.length === 0 && mainImages.length > 0 && currentIdx < mainImages.length && (
						<View style={{ backgroundColor: 'rgba(59,130,246,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
							<Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
								Foto Principal
							</Text>
							{mainImages.length > 1 && (
								<Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
									{currentIdx + 1}/{mainImages.length}
								</Text>
							)}
						</View>
					)}
					{images.length > 1 && (
						<View style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
							<Text style={{ color: 'white', fontSize: 12 }}>
								{currentIdx + 1}/{images.length}
							</Text>
						</View>
					)}
					{has360 ? (
						<Pressable onPress={() => setMode360((v) => !v)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
							<Text style={{ color: 'white', fontSize: 12 }}>{mode360 ? 'Sair 360°' : 'Ver 360°'}</Text>
						</Pressable>
					) : null}
					<Pressable onPress={() => setShowZoom(true)} style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
						<Text style={{ color: 'white', fontSize: 12 }}>Toque para zoom</Text>
					</Pressable>
				</View>

                {/* Fullscreen Zoom Modal */}
                <Modal visible={showZoom} transparent animationType="fade" onRequestClose={() => setShowZoom(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
                        <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}>
                            <Pressable onPress={() => setShowZoom(false)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '800' }}>Fechar</Text>
                            </Pressable>
                        </View>
                        {Platform.OS === 'ios' ? (
                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}
                                maximumZoomScale={4}
                                minimumZoomScale={1}
                                centerContent
                            >
                                <Image source={{ uri: getFullImageUrl(String(images[currentIdx])) }} style={{ width: '100%', height: undefined, aspectRatio: 1 }} resizeMode="contain" />
                            </ScrollView>
                        ) : (
                            <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => setAndroidZoom2x((z) => !z)}>
                                <Image source={{ uri: getFullImageUrl(String(images[currentIdx])) }} style={{ width: '100%', height: undefined, aspectRatio: 1, transform: [{ scale: androidZoom2x ? 2 : 1 }] }} resizeMode="contain" />
                                <Text style={{ position: 'absolute', bottom: 30, color: 'white' }}>{androidZoom2x ? 'Toque para 1x' : 'Toque para 2x'}</Text>
                            </Pressable>
                        )}
                    </View>
                </Modal>

		{/* Seletor de tamanho quando disponível */}
		{sizeOptions.length ? (
					<View>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing(2) }}>
						<Text style={{ fontWeight: '700', fontSize: 16 }}>Tamanho</Text>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
							<Ionicons name="star" size={14} color={theme.colors.accent} />
							<Text style={{ color: theme.colors.subtext, fontWeight: '700' }}>{(item.rating ?? 4.8).toFixed(1)}</Text>
						</View>
					</View>
					<View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
						{sizeOptions.map((s) => (
							<SizeChip key={s} value={s} selected={size === s} onPress={() => setSize(s)} />
						))}
					</View>
					
					{/* Seletor de cores do tamanho selecionado */}
					{CLOTHING_CATEGORIES.includes(item?.sub_category || '') && size && item?.size_colors && item.size_colors[size] && item.size_colors[size].length > 0 && (
						<View style={{ marginTop: theme.spacing(2) }}>
							<Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700', marginBottom: theme.spacing(1) }]}>
								Cor {selectedColor ? `(${selectedColor})` : ''}
							</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), flexWrap: 'wrap' }}>
								{item.size_colors[size].map((color: string, index: number) => (
									<Pressable 
										key={color + index}
										onPress={() => setSelectedColor(color)}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											backgroundColor: selectedColor === color ? theme.colors.accent : 'white',
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(1.5),
											borderRadius: 16,
											borderWidth: 2,
											borderColor: selectedColor === color ? theme.colors.accent : theme.colors.border,
											gap: theme.spacing(1),
											...theme.shadow.button,
										}}
									>
										<View style={{
											width: 16,
											height: 16,
											borderRadius: 8,
											backgroundColor: getColorHex(color),
											borderWidth: 2,
											borderColor: selectedColor === color ? 'white' : theme.colors.border,
										}} />
										<Text style={[theme.font.label, { 
											color: selectedColor === color ? 'white' : theme.colors.text, 
											fontWeight: '700' 
										}]}>
											{color}
										</Text>
										{selectedColor === color && (
											<Ionicons name="checkmark-circle" size={16} color="white" />
										)}
									</Pressable>
								))}
							</View>
						</View>
					)}
					</View>
			) : null}

				{/* Title & Price with rating/favorite */}
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing(2) }}>
					<View style={{ flex: 1 }}>
						<Text style={[theme.font.h2]}>{item.name}</Text>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
							<Ionicons name="star" size={14} color={theme.colors.accent} />
							<Text style={{ color: theme.colors.subtext, fontWeight: '600' }}>{(item.rating ?? 4.8).toFixed(1)}</Text>
						</View>
					</View>
					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontWeight: '800', fontSize: 18, color: theme.colors.accent }}>MT {item.price.toFixed(2)}</Text>
						{/* Mostrar estoque geral ou por tamanho */}
						{CLOTHING_CATEGORIES.includes(item?.sub_category || '') && size && item?.size_stock && item.size_stock[size] !== undefined ? (
							<View style={{ alignItems: 'flex-end' }}>
								{item.size_stock[size] > 0 ? (
									<Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: '600' }}>
										✓ Em estoque ({item.size_stock[size]} unidade{item.size_stock[size] > 1 ? 's' : ''})
									</Text>
								) : (
									<Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '600' }}>
										✗ Esgotado (tamanho {size})
									</Text>
								)}
								<Text style={{ color: theme.colors.subtext, fontSize: 10, fontWeight: '500' }}>
									Estoque específico do tamanho
								</Text>
							</View>
						) : (
							<View style={{ alignItems: 'flex-end' }}>
								{item.stock > 0 ? (
									<Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: '600' }}>
										✓ Em estoque ({item.stock})
									</Text>
								) : (
									<Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '600' }}>
										✗ Esgotado
									</Text>
								)}
								<Text style={{ color: theme.colors.subtext, fontSize: 10, fontWeight: '500' }}>
									Estoque geral
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Category and Reference */}
				<View style={{ 
					flexDirection: 'row', 
					gap: theme.spacing(2), 
					marginTop: theme.spacing(2),
					flexWrap: 'wrap'
				}}>
					{item.main_category && (
						<View style={{
							backgroundColor: theme.colors.accentSoft,
							paddingHorizontal: theme.spacing(2),
							paddingVertical: theme.spacing(1),
							borderRadius: theme.radii.full,
						}}>
							<Text style={[theme.font.labelSmall, { color: theme.colors.accent, fontWeight: '700' }]}>
								{item.main_category}
							</Text>
						</View>
					)}
					{item.sub_category && (
						<View style={{
							backgroundColor: theme.colors.neutralSoft,
							paddingHorizontal: theme.spacing(2),
							paddingVertical: theme.spacing(1),
							borderRadius: theme.radii.full,
						}}>
							<Text style={[theme.font.labelSmall, { color: theme.colors.text, fontWeight: '600' }]}>
								{item.sub_category}
							</Text>
						</View>
					)}
					{item.attributes && (item.attributes as any).referencia && (
						<View style={{
							backgroundColor: theme.colors.neutralSoft,
							paddingHorizontal: theme.spacing(2),
							paddingVertical: theme.spacing(1),
							borderRadius: theme.radii.full,
						}}>
							<Text style={[theme.font.labelSmall, { color: theme.colors.text, fontWeight: '600' }]}>
								Ref: {(item.attributes as any).referencia}
							</Text>
						</View>
					)}
				</View>

				{/* Tabs */}
				<View style={{ flexDirection: 'row', gap: 8, marginTop: theme.spacing(1) }}>
					<Chip label="Descrição" active={tab === 'desc'} onPress={() => setTab('desc')} />
					<Chip label="Avaliações" active={tab === 'reviews'} onPress={() => setTab('reviews')} />
				</View>
			{tab === 'desc' ? (
				<View style={{ marginTop: theme.spacing(2) }}>
					{/* Description */}
					{item.description && (
						<View style={{ 
							backgroundColor: 'white', 
							borderRadius: 24, 
							padding: theme.spacing(4),
							marginBottom: theme.spacing(3),
							borderWidth: 1,
							borderColor: theme.colors.borderLight,
							...theme.shadow.card
						}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(3) }}>
								<View style={{
									backgroundColor: theme.colors.accentSoft,
									borderRadius: theme.radii.full,
									padding: theme.spacing(1.5),
									...theme.shadow.button,
								}}>
									<Ionicons name="document-text" size={20} color={theme.colors.accent} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
										Descrição do Produto
									</Text>
									<Text style={[theme.font.caption, { color: theme.colors.subtext, marginTop: 2 }]}>
										Informações detalhadas
									</Text>
								</View>
							</View>
							<View style={{
								backgroundColor: theme.colors.neutralSoft,
								borderRadius: theme.radii.lg,
								padding: theme.spacing(3),
								borderLeftWidth: 4,
								borderLeftColor: theme.colors.accent,
							}}>
								<Text style={{ 
									color: theme.colors.text, 
									lineHeight: 24,
									fontSize: 15,
									fontWeight: '400'
								}}>
									{item.description}
								</Text>
							</View>
						</View>
					)}

					{/* Product Details */}
					{item.attributes && Object.keys(item.attributes).filter(k => k !== 'image_urls' && k !== 'tamanho').length > 0 && (
						<View style={{ 
							backgroundColor: 'white', 
							borderRadius: 24, 
							padding: theme.spacing(4),
							marginBottom: theme.spacing(3),
							borderWidth: 1,
							borderColor: theme.colors.borderLight,
							...theme.shadow.card
						}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(3) }}>
								<View style={{
									backgroundColor: theme.colors.positiveSoft,
									borderRadius: theme.radii.full,
									padding: theme.spacing(1.5),
									...theme.shadow.button,
								}}>
									<Ionicons name="list" size={20} color={theme.colors.success} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
										Especificações Técnicas
									</Text>
									<Text style={[theme.font.caption, { color: theme.colors.subtext, marginTop: 2 }]}>
										Características do produto
									</Text>
								</View>
							</View>
							<View style={{ gap: theme.spacing(1.5) }}>
								{Object.entries(item.attributes).filter(([k]) => k !== 'image_urls' && k !== 'tamanho').map(([k, v], index, array) => (
									<View key={k} style={{ 
										flexDirection: 'row', 
										justifyContent: 'space-between',
										alignItems: 'center',
										paddingVertical: theme.spacing(2),
										paddingHorizontal: theme.spacing(2.5),
										backgroundColor: index % 2 === 0 ? theme.colors.neutralSoft : 'white',
										borderRadius: theme.radii.lg,
										borderWidth: 1,
										borderColor: theme.colors.borderLight,
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), flex: 1 }}>
											<View style={{
												width: 6,
												height: 6,
												borderRadius: 3,
												backgroundColor: theme.colors.accent,
											}} />
											<Text style={{ 
												color: theme.colors.text, 
												fontWeight: '700',
												fontSize: 14
											}}>
												{friendlyLabel(k)}
											</Text>
										</View>
										<View style={{
											backgroundColor: theme.colors.accentSoft,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(0.5),
											borderRadius: theme.radii.full,
										}}>
											<Text style={{ 
												color: theme.colors.accent, 
												fontWeight: '700',
												fontSize: 13
											}}>
												{String(v)}
											</Text>
										</View>
									</View>
								))}
							</View>
						</View>
					)}

				{/* Size-specific details */}
				{CLOTHING_CATEGORIES.includes(item?.sub_category || '') && size && (
						<View style={{ 
							backgroundColor: 'white', 
							borderRadius: 24, 
							padding: theme.spacing(4),
							borderWidth: 1,
							borderColor: theme.colors.borderLight,
							...theme.shadow.card,
							overflow: 'hidden'
						}}>
							{/* Header com gradiente */}
							<View style={{ 
								flexDirection: 'row', 
								alignItems: 'center', 
								gap: theme.spacing(2), 
								marginBottom: theme.spacing(3),
								paddingBottom: theme.spacing(3),
								borderBottomWidth: 2,
								borderBottomColor: theme.colors.borderLight,
							}}>
								<View style={{
									backgroundColor: theme.colors.warningSoft,
									borderRadius: theme.radii.full,
									padding: theme.spacing(1.5),
									...theme.shadow.button,
								}}>
									<Ionicons name="resize" size={20} color={theme.colors.warning} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
										Detalhes do Tamanho
									</Text>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1), marginTop: 4 }}>
										<View style={{
											backgroundColor: theme.colors.accent,
											paddingHorizontal: theme.spacing(2),
											paddingVertical: theme.spacing(0.5),
											borderRadius: theme.radii.full,
										}}>
											<Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>
												{size}
											</Text>
										</View>
										<Text style={[theme.font.caption, { color: theme.colors.subtext }]}>
											Tamanho selecionado
										</Text>
									</View>
								</View>
							</View>
							
							<View style={{ gap: theme.spacing(2.5) }}>
								{/* Cores disponíveis */}
								{item?.size_colors && item.size_colors[size] && item.size_colors[size].length > 0 && (
									<View style={{ 
										backgroundColor: theme.colors.neutralSoft,
										borderRadius: theme.radii.lg,
										padding: theme.spacing(3),
										borderLeftWidth: 4,
										borderLeftColor: theme.colors.accent,
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), marginBottom: theme.spacing(2) }}>
											<Ionicons name="color-palette" size={18} color={theme.colors.accent} />
											<Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
												Cores Disponíveis
											</Text>
											<View style={{
												backgroundColor: theme.colors.accentSoft,
												paddingHorizontal: theme.spacing(1.5),
												paddingVertical: 2,
												borderRadius: theme.radii.full,
												marginLeft: 'auto',
											}}>
												<Text style={{ color: theme.colors.accent, fontWeight: '700', fontSize: 11 }}>
													{item.size_colors[size].length} {item.size_colors[size].length > 1 ? 'cores' : 'cor'}
												</Text>
											</View>
										</View>
										<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) }}>
											{item.size_colors[size].map((color: string, index: number) => (
												<View key={color + index} style={{
													flexDirection: 'row',
													alignItems: 'center',
													backgroundColor: 'white',
													paddingHorizontal: theme.spacing(2),
													paddingVertical: theme.spacing(1.5),
													borderRadius: theme.radii.lg,
													gap: theme.spacing(1),
													borderWidth: 1,
													borderColor: theme.colors.borderLight,
													...theme.shadow.button,
												}}>
													<View style={{
														width: 20,
														height: 20,
														borderRadius: 10,
														backgroundColor: getColorHex(color),
														borderWidth: 2,
														borderColor: theme.colors.accent,
														...theme.shadow.button,
													}} />
													<Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>
														{color}
													</Text>
												</View>
											))}
										</View>
									</View>
								)}
								
								{/* Estoque disponível */}
								{item?.size_stock && item.size_stock[size] !== undefined && (
									<View style={{ 
										backgroundColor: item.size_stock[size] > 0 ? theme.colors.positiveSoft : theme.colors.errorSoft,
										borderRadius: theme.radii.lg,
										padding: theme.spacing(3),
										borderLeftWidth: 4,
										borderLeftColor: item.size_stock[size] > 0 ? theme.colors.success : theme.colors.error,
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) }}>
												<Ionicons 
													name={item.size_stock[size] > 0 ? "checkmark-circle" : "close-circle"} 
													size={22} 
													color={item.size_stock[size] > 0 ? theme.colors.success : theme.colors.error} 
												/>
												<View>
													<Text style={{ 
														color: item.size_stock[size] > 0 ? theme.colors.success : theme.colors.error, 
														fontWeight: '700',
														fontSize: 15
													}}>
														{item.size_stock[size] > 0 ? 'Em Estoque' : 'Esgotado'}
													</Text>
													<Text style={{ 
														color: item.size_stock[size] > 0 ? theme.colors.success : theme.colors.error, 
														fontWeight: '500',
														fontSize: 12,
														opacity: 0.8
													}}>
														{item.size_stock[size]} {item.size_stock[size] > 1 ? 'unidades disponíveis' : 'unidade disponível'}
													</Text>
												</View>
											</View>
											<View style={{
												backgroundColor: 'white',
												paddingHorizontal: theme.spacing(2.5),
												paddingVertical: theme.spacing(1.5),
												borderRadius: theme.radii.full,
												minWidth: 50,
												alignItems: 'center',
												...theme.shadow.button,
											}}>
												<Text style={{ 
													color: item.size_stock[size] > 0 ? theme.colors.success : theme.colors.error, 
													fontWeight: '800',
													fontSize: 18
												}}>
													{item.size_stock[size]}
												</Text>
											</View>
										</View>
									</View>
								)}
								
								{/* Fotos específicas do tamanho */}
								{item?.size_images && item.size_images[size] && item.size_images[size].length > 0 && (
									<View style={{ 
										backgroundColor: theme.colors.neutralSoft,
										borderRadius: theme.radii.lg,
										padding: theme.spacing(3),
										borderLeftWidth: 4,
										borderLeftColor: theme.colors.success,
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) }}>
												<Ionicons name="camera" size={20} color={theme.colors.success} />
												<Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
													Fotos Específicas
												</Text>
											</View>
											<View style={{
												backgroundColor: theme.colors.positiveSoft,
												paddingHorizontal: theme.spacing(2),
												paddingVertical: theme.spacing(0.5),
												borderRadius: theme.radii.full,
											}}>
												<Text style={{ color: theme.colors.success, fontWeight: '700', fontSize: 12 }}>
													{item.size_images[size].length} {item.size_images[size].length > 1 ? 'fotos' : 'foto'}
												</Text>
											</View>
										</View>
										<Text style={{ color: theme.colors.subtext, fontSize: 12, marginTop: theme.spacing(1), fontWeight: '500' }}>
											Este tamanho possui imagens exclusivas
										</Text>
									</View>
								)}
								
								{/* Fotos principais (quando não há fotos específicas) */}
								{(!item?.size_images || !item.size_images[size] || item.size_images[size].length === 0) && mainImages.length > 0 && (
									<View style={{ 
										backgroundColor: theme.colors.neutralSoft,
										borderRadius: theme.radii.lg,
										padding: theme.spacing(3),
										borderLeftWidth: 4,
										borderLeftColor: theme.colors.info,
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) }}>
												<Ionicons name="image" size={20} color={theme.colors.info} />
												<Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
													Fotos Principais
												</Text>
											</View>
											<View style={{
												backgroundColor: theme.colors.infoSoft,
												paddingHorizontal: theme.spacing(2),
												paddingVertical: theme.spacing(0.5),
												borderRadius: theme.radii.full,
											}}>
												<Text style={{ color: theme.colors.info, fontWeight: '700', fontSize: 12 }}>
													{mainImages.length} {mainImages.length > 1 ? 'fotos' : 'foto'}
												</Text>
											</View>
										</View>
										<Text style={{ color: theme.colors.subtext, fontSize: 12, marginTop: theme.spacing(1), fontWeight: '500' }}>
											Exibindo galeria geral do produto
										</Text>
									</View>
								)}
							</View>
						</View>
					)}
					</View>
				) : (
                    <View style={{ marginTop: 8 }}>
                        {reviews.length === 0 ? (
                            <Text style={{ color: theme.colors.subtext }}>Ainda não há avaliações.</Text>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {reviews.map((r) => (
                                    <View key={r.id} style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="person" size={16} color={theme.colors.subtext} />
                                            <Text style={{ fontWeight: '700' }}>{r.user_name || `Cliente #${r.user_id}`}</Text>
                                            <View style={{ flexDirection: 'row', marginLeft: 'auto', alignItems: 'center', gap: 2 }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Ionicons key={i} name={i < r.rating ? 'star' : 'star-outline'} size={14} color={theme.colors.accent} />
                                                ))}
                                            </View>
                                        </View>
                                        {r.comment ? <Text style={{ marginTop: 4, color: theme.colors.text }}>{r.comment}</Text> : null}
                                        <Text style={{ marginTop: 4, color: theme.colors.subtext, fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* New review form */}
                        <View style={{ marginTop: theme.spacing(2), borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing(2) }}>
                            <Text style={{ fontWeight: '800', marginBottom: 8 }}>Avaliar este produto</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Pressable key={i} onPress={() => setMyRating(i + 1)}>
                                        <Ionicons name={i < myRating ? 'star' : 'star-outline'} size={20} color={theme.colors.accent} />
                                    </Pressable>
                                ))}
                            </View>
                            <View style={{ marginTop: 8, backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.md }}>
                                <TextInput
                                    placeholder="Escreva um comentário (opcional)"
                                    style={{ padding: 12, minHeight: 44 }}
                                    placeholderTextColor={theme.colors.subtext}
                                    value={myComment}
                                    onChangeText={setMyComment}
                                />
                            </View>
                            <View style={{ marginTop: 8 }}>
                                <AnimatedButton
                                    title="Enviar avaliação"
                                    onPress={async () => {
                                        if (myRating <= 0) return;
                                        const r = await createReview(id, { rating: myRating, comment: myComment || undefined });
                                        setReviews((prev) => [r, ...prev]);
                                        setMyRating(0);
                                        setMyComment('');
                                    }}
                                    fullWidth
                                    icon="paper-plane"
                                    iconPosition="right"
                                />
                            </View>
                        </View>
			</View>
                )}
        </ScrollView>

		{/* Bottom CTA */}
		<View style={{ padding: theme.spacing(2), borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: 'white' }}>
			<AnimatedButton 
				title="Comprar agora" 
				onPress={() => {
					// Usar a cor SELECIONADA pelo usuário (não a primeira do array)
					const colorToAdd = selectedColor || undefined;
					
					// IMPORTANTE: Criar uma CÓPIA PROFUNDA do produto para não modificar o original
					const productCopy: Product = JSON.parse(JSON.stringify(item));
					
					// Se há imagens específicas do tamanho, usá-las como preview no carrinho
					if (size && item.size_images && item.size_images[size] && item.size_images[size].length > 0) {
						productCopy.image_url = item.size_images[size][0];
					}
					
					addToCart(productCopy, 1, size || undefined, colorToAdd);
				}}
				fullWidth
				icon="cart"
				iconPosition="right"
			/>
		</View>
		</View>
	);
}
