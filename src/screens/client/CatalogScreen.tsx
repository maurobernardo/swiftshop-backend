import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, Switch, TextInput, ScrollView, Pressable } from 'react-native';
import Skeleton from '../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { listProducts } from '../../api/products';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { theme } from '../../theme';
import Chip from '../../components/Chip';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavorites } from '../../contexts/FavoritesContext';

const CATEGORY_MAP = {
	Vestuário: ['Sapato', 'Camisa', 'Camiseta', 'Calça'],
	Tecnologia: ['Computador', 'Laptop', 'Telefone'],
} as const;

type MainCategory = keyof typeof CATEGORY_MAP;
type WithAll<T extends string> = T | 'Todos';

export default function CatalogScreen({ navigation }: any) {
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState<Product[]>([]);
	const [mainCategory, setMainCategory] = useState<WithAll<MainCategory>>('Todos');
	const [subCategory, setSubCategory] = useState<WithAll<string>>('Todos');
	const subs = useMemo(() => (mainCategory === 'Todos' ? [] : CATEGORY_MAP[mainCategory]), [mainCategory]);
	const { addToCart } = useCart();
	const { favorites } = useFavorites();
	const [onlyFav, setOnlyFav] = useState(false);
	const [minPrice, setMinPrice] = useState<string>('');
	const [maxPrice, setMaxPrice] = useState<string>('');
	const [minRating, setMinRating] = useState<number>(0);
	const [brand, setBrand] = useState<string>('Todos');
	const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'newest'>('relevance');

	const fetchData = async () => {
		setLoading(true);
		try {
			const filters: any = {};
			if (mainCategory !== 'Todos') filters.main_category = mainCategory;
			if (subCategory !== 'Todos') filters.sub_category = subCategory;
			const res = await listProducts(filters);
			setItems(res);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mainCategory, subCategory]);

	const brands = useMemo(() => {
		const set = new Set<string>();
		for (const it of items) {
			const attrs: any = it.attributes || {};
			const b = attrs.marca || attrs.brand;
			if (typeof b === 'string' && b.trim()) set.add(b.trim());
		}
		return ['Todos', ...Array.from(set).sort()];
	}, [items]);

	const filtered = useMemo(() => {
		let list = [...items];
		if (onlyFav) list = list.filter((i) => favorites.includes(i.id));
		const min = Number(minPrice) || 0;
		const max = Number(maxPrice) || Number.POSITIVE_INFINITY;
		list = list.filter((i) => i.price >= min && i.price <= max);
		if (minRating > 0) {
			list = list.filter((i) => {
				const rating = (i.rating as any) ?? (i.attributes as any)?.rating ?? 0;
				return Number(rating) >= minRating;
			});
		}
		if (brand !== 'Todos') {
			list = list.filter((i) => {
				const attrs: any = i.attributes || {};
				const b = attrs.marca || attrs.brand;
				return String(b).trim() === brand;
			});
		}
		switch (sortBy) {
			case 'price_asc':
				list.sort((a, b) => a.price - b.price);
				break;
			case 'price_desc':
				list.sort((a, b) => b.price - a.price);
				break;
			case 'newest':
				list.sort((a, b) => b.id - a.id);
				break;
			default:
				break;
		}
		return list;
	}, [items, onlyFav, minPrice, maxPrice, minRating, brand, sortBy, favorites]);

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			{/* Cabeçalho */}
            <View style={{ 
				paddingHorizontal: theme.spacing(2), 
				paddingTop: theme.spacing(6), 
				paddingBottom: theme.spacing(2),
				backgroundColor: 'white',
				borderBottomWidth: 1,
				borderBottomColor: theme.colors.borderLight,
			}}>
                <Text style={[theme.font.h1, { color: theme.colors.primary, marginBottom: theme.spacing(1) }]}>
					Explorar
				</Text>
				<Text style={[theme.font.body, { color: theme.colors.subtext, marginBottom: theme.spacing(2) }]}>
					Descubra produtos incríveis
				</Text>
			</View>

			{/* Banner promocional */}
            <View style={{ paddingHorizontal: theme.spacing(2), marginBottom: theme.spacing(3) }}>
                <LinearGradient 
					colors={[theme.colors.accent, '#A78BFA']} 
					start={{ x: 0, y: 0 }} 
					end={{ x: 1, y: 1 }} 
					style={{ 
						borderRadius: 20, 
						padding: theme.spacing(2.5), 
						flexDirection: 'row', 
						alignItems: 'center', 
						justifyContent: 'space-between',
						...theme.shadow.card,
						borderWidth: 1, 
						borderColor: 'rgba(255,255,255,0.2)',
					}}
				>
					<View style={{ flex: 1 }}>
                        <Text style={{ 
							color: 'white', 
							...theme.font.h3,
							marginBottom: theme.spacing(0.5)
						}}>
							Desconto especial no primeiro pedido
						</Text>
                        <View style={{ 
							alignSelf: 'flex-start', 
							backgroundColor: 'rgba(255,255,255,0.95)', 
							paddingHorizontal: theme.spacing(1),
							paddingVertical: theme.spacing(0.6),
							borderRadius: 12,
							...theme.shadow.button,
						}}>
							<Text style={{ 
								color: theme.colors.primary, 
								fontSize: 13,
								fontWeight: '600'
							}}>
								Comprar agora
							</Text>
						</View>
					</View>
					<View style={{ 
						backgroundColor: 'rgba(255,255,255,0.15)', 
						borderRadius: theme.radii.full, 
						padding: theme.spacing(1),
						marginLeft: theme.spacing(1)
					}}>
						<Ionicons name="pricetag" size={24} color={'rgba(255,255,255,0.9)'} />
					</View>
				</LinearGradient>
			</View>

			{/* Categorias principais */}
			<View style={{ 
				paddingHorizontal: theme.spacing(2), 
				marginBottom: theme.spacing(2),
				backgroundColor: 'white',
				paddingVertical: theme.spacing(1.5),
			}}>
				<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
					Categorias
				</Text>
				<View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
					{(['Todos', ...Object.keys(CATEGORY_MAP)] as WithAll<MainCategory>[]).map((m) => (
						<Chip
							key={String(m)}
							label={String(m)}
							active={mainCategory === m}
							iconName={m === 'Vestuário' ? 'shirt' : m === 'Tecnologia' ? 'laptop' : undefined}
							onPress={() => {
								setMainCategory(m);
								setSubCategory('Todos');
							}}
						/>
					))}
				</View>
			</View>

			{/* Filtro de favoritos */}
			<View style={{ 
				paddingHorizontal: theme.spacing(2), 
				marginBottom: theme.spacing(2),
				backgroundColor: 'white',
				paddingVertical: theme.spacing(1.5),
				flexDirection: 'row', 
				alignItems: 'center', 
				gap: theme.spacing(1),
				borderRadius: theme.radii.md,
				borderWidth: 1,
				borderColor: theme.colors.borderLight,
			}}>
				<Switch 
					value={onlyFav} 
					onValueChange={setOnlyFav}
					trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
					thumbColor={onlyFav ? theme.colors.accent : theme.colors.subtext}
				/>
				<Text style={[theme.font.label, { color: theme.colors.text }]}>
					Somente favoritos
				</Text>
				{onlyFav && (
					<View style={{
						backgroundColor: theme.colors.accentSoft,
						paddingHorizontal: theme.spacing(1),
						paddingVertical: theme.spacing(0.5),
						borderRadius: 10,
						marginLeft: 'auto',
					}}>
						<Text style={[theme.font.labelSmall, { color: theme.colors.accent }]}>
							{favorites.length} itens
						</Text>
					</View>
				)}
			</View>

			{/* Subcategorias */}
			{subs.length > 0 && (
				<View style={{ 
					paddingHorizontal: theme.spacing(2), 
					marginBottom: theme.spacing(2),
					backgroundColor: 'white',
					paddingVertical: theme.spacing(1.5),
				}}>
					<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
						Subcategorias
					</Text>
					<View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
						{(['Todos', ...subs] as WithAll<string>[]).map((s) => (
							<Chip
								key={String(s)}
								label={String(s)}
								active={subCategory === s}
								iconName={s === 'Sapato' ? 'walk' : s === 'Camisa' ? 'shirt' : s === 'Computador' ? 'desktop' : s === 'Telefone' ? 'call' : undefined}
								onPress={() => setSubCategory(s)}
							/>
						))}
					</View>
				</View>
			)}

			{/* Barra de filtros avançados */}
			<View style={{ 
				backgroundColor: 'white',
				paddingVertical: theme.spacing(1.5),
				marginBottom: theme.spacing(2),
			}}>
				<Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1), paddingHorizontal: theme.spacing(2) }]}>
					Filtros Avançados
				</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing(2), gap: theme.spacing(1.5) }}>
					<View style={{ 
						flexDirection: 'row', 
						alignItems: 'center', 
						gap: theme.spacing(1), 
						backgroundColor: theme.colors.neutralSoft, 
						borderWidth: 1, 
						borderColor: theme.colors.border, 
						borderRadius: 16, 
						paddingHorizontal: theme.spacing(1.5), 
						paddingVertical: theme.spacing(1),
						...theme.shadow.button,
					}}>
						<Ionicons name="cash" size={16} color={theme.colors.primary} />
						<Text style={[theme.font.labelSmall, { color: theme.colors.text }]}>Preço</Text>
						<TextInput 
							value={minPrice} 
							onChangeText={setMinPrice} 
							keyboardType="numeric" 
							placeholder="mín" 
							style={{ 
								minWidth: 48,
								backgroundColor: 'white',
								borderRadius: 10,
								paddingHorizontal: theme.spacing(1),
								paddingVertical: theme.spacing(0.5),
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
								...theme.font.bodySmall,
							}} 
							placeholderTextColor={theme.colors.subtext} 
						/>
						<Text style={[theme.font.bodySmall, { color: theme.colors.subtext }]}>—</Text>
						<TextInput 
							value={maxPrice} 
							onChangeText={setMaxPrice} 
							keyboardType="numeric" 
							placeholder="máx" 
							style={{ 
								minWidth: 48,
								backgroundColor: 'white',
								borderRadius: 10,
								paddingHorizontal: theme.spacing(1),
								paddingVertical: theme.spacing(0.5),
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
								...theme.font.bodySmall,
							}} 
							placeholderTextColor={theme.colors.subtext} 
						/>
					</View>

					<View style={{ 
						flexDirection: 'row', 
						alignItems: 'center', 
						gap: theme.spacing(1), 
						backgroundColor: theme.colors.neutralSoft, 
						borderWidth: 1, 
						borderColor: theme.colors.border, 
						borderRadius: 16, 
						paddingHorizontal: theme.spacing(1.5), 
						paddingVertical: theme.spacing(1),
						...theme.shadow.button,
					}}>
						<Ionicons name="pricetag" size={16} color={theme.colors.primary} />
						<Text style={[theme.font.labelSmall, { color: theme.colors.text }]}>Marca</Text>
						<View style={{ flexDirection: 'row', gap: theme.spacing(0.75) }}>
							{brands.slice(0, 4).map((b) => (
								<Pressable 
									key={b} 
									onPress={() => setBrand(b)} 
									style={{ 
										paddingHorizontal: theme.spacing(1), 
										paddingVertical: theme.spacing(0.5), 
										borderRadius: theme.radii.full, 
										borderWidth: 1, 
										borderColor: brand === b ? theme.colors.accent : theme.colors.border, 
										backgroundColor: brand === b ? theme.colors.accentSoft : 'white',
										...theme.shadow.button,
									}}
								>
									<Text style={{ 
										color: brand === b ? theme.colors.accent : theme.colors.primary, 
										...theme.font.labelSmall,
										fontWeight: '600'
									}}>
										{b}
									</Text>
								</Pressable>
							))}
						</View>
					</View>

					<View style={{ 
						flexDirection: 'row', 
						alignItems: 'center', 
						gap: theme.spacing(1), 
						backgroundColor: theme.colors.neutralSoft, 
						borderWidth: 1, 
						borderColor: theme.colors.border, 
						borderRadius: 16, 
						paddingHorizontal: theme.spacing(1.5), 
						paddingVertical: theme.spacing(1),
						...theme.shadow.button,
					}}>
						<Ionicons name="star" size={16} color={theme.colors.primary} />
						<Text style={[theme.font.labelSmall, { color: theme.colors.text }]}>Avaliação</Text>
						<View style={{ flexDirection: 'row', gap: theme.spacing(0.5) }}>
							{[0, 3, 4, 4.5].map((r) => (
								<Pressable 
									key={String(r)} 
									onPress={() => setMinRating(r)} 
									style={{ 
										paddingHorizontal: theme.spacing(1), 
										paddingVertical: theme.spacing(0.5), 
										borderRadius: theme.radii.full, 
										borderWidth: 1, 
										borderColor: minRating === r ? theme.colors.accent : theme.colors.border, 
										backgroundColor: minRating === r ? theme.colors.accentSoft : 'white',
										...theme.shadow.button,
									}}
								>
									<Text style={{ 
										color: minRating === r ? theme.colors.accent : theme.colors.primary, 
										...theme.font.labelSmall,
										fontWeight: '600'
									}}>
										{r === 0 ? 'Todas' : `${r}+`}
									</Text>
								</Pressable>
							))}
						</View>
					</View>

					<View style={{ 
						flexDirection: 'row', 
						alignItems: 'center', 
						gap: theme.spacing(1), 
						backgroundColor: theme.colors.neutralSoft, 
						borderWidth: 1, 
						borderColor: theme.colors.border, 
						borderRadius: 16, 
						paddingHorizontal: theme.spacing(1.5), 
						paddingVertical: theme.spacing(1),
						...theme.shadow.button,
					}}>
						<Ionicons name="filter" size={16} color={theme.colors.primary} />
						<Text style={[theme.font.labelSmall, { color: theme.colors.text }]}>Ordenar</Text>
						<View style={{ flexDirection: 'row', gap: theme.spacing(0.5) }}>
							{([
								{ key: 'relevance', label: 'Relevância' },
								{ key: 'price_asc', label: 'Preço ↑' },
								{ key: 'price_desc', label: 'Preço ↓' },
								{ key: 'newest', label: 'Novidades' },
							] as const).map((opt) => (
								<Pressable 
									key={opt.key} 
									onPress={() => setSortBy(opt.key)} 
									style={{ 
										paddingHorizontal: theme.spacing(1), 
										paddingVertical: theme.spacing(0.5), 
										borderRadius: theme.radii.full, 
										borderWidth: 1, 
										borderColor: sortBy === opt.key ? theme.colors.accent : theme.colors.border, 
										backgroundColor: sortBy === opt.key ? theme.colors.accentSoft : 'white',
										...theme.shadow.button,
									}}
								>
									<Text style={{ 
										color: sortBy === opt.key ? theme.colors.accent : theme.colors.primary, 
										...theme.font.labelSmall,
										fontWeight: '600'
									}}>
										{opt.label}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				</ScrollView>
			</View>

			{/* Grade de produtos - layout assimétrico simples */}
			{loading ? (
				<View style={{ paddingHorizontal: theme.spacing(2) }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(2) }}>
						<View style={{ width: '48%' }}>
							<Skeleton height={110} radius={14} />
							<Skeleton height={14} style={{ marginTop: 10 }} />
							<Skeleton height={14} width={80} style={{ marginTop: 6 }} />
						</View>
						<View style={{ width: '48%' }}>
							<Skeleton height={150} radius={14} />
							<Skeleton height={14} style={{ marginTop: 10 }} />
							<Skeleton height={14} width={80} style={{ marginTop: 6 }} />
						</View>
					</View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(2) }}>
						<View style={{ width: '48%' }}>
							<Skeleton height={150} radius={14} />
							<Skeleton height={14} style={{ marginTop: 10 }} />
							<Skeleton height={14} width={80} style={{ marginTop: 6 }} />
						</View>
						<View style={{ width: '48%' }}>
							<Skeleton height={110} radius={14} />
							<Skeleton height={14} style={{ marginTop: 10 }} />
							<Skeleton height={14} width={80} style={{ marginTop: 6 }} />
						</View>
					</View>
				</View>
			) : (
				<FlatList
					contentContainerStyle={{ paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(3), gap: theme.spacing(2) }}
					data={filtered}
					numColumns={2}
					columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: theme.spacing(2) }}
					keyExtractor={(item) => String(item.id)}
					renderItem={({ item, index }) => (
						<ProductCard large={index % 3 === 0} product={item} onPress={() => navigation.navigate('Detalhe', { id: item.id })} onAdd={() => addToCart(item)} />
					)}
					ListEmptyComponent={
						<EmptyState
							icon="search-outline"
							title="Nenhum produto encontrado"
							description="Tente ajustar seus filtros ou buscar por outro termo"
							actionLabel="Limpar filtros"
							onAction={() => {
								setMainCategory('Todos');
								setSubCategory('Todos');
								setMinPrice('');
								setMaxPrice('');
								setMinRating(0);
								setBrand('Todos');
								setOnlyFav(false);
							}}
						/>
					}
				/>
			)}
		</View>
	);
}
