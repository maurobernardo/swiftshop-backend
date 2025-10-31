import React, { useRef, useState } from 'react';
import { Image, Text, View, Pressable, Platform, Animated, Easing, FlatList } from 'react-native';
import { theme } from '../theme';
import { Product } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getFullImageUrl } from '../utils/imageUtils';

interface Props {
    product: Product;
    onPress?: () => void;
    onAdd?: () => void;
    large?: boolean;
}

export default function ProductCard({ product, onPress, onAdd, large }: Props) {
	const { isFavorite, toggleFavorite } = useFavorites();
	const [isPressed, setIsPressed] = useState(false);
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const heartScale = useRef(new Animated.Value(1)).current;
	const addScale = useRef(new Animated.Value(1)).current;
	const [imgIdx, setImgIdx] = useState(0);
	const images = (product.image_urls && product.image_urls.length > 0)
		? product.image_urls
		: product.image_url ? [product.image_url] : [];

	const handlePressIn = () => {
		setIsPressed(true);
		Animated.timing(scaleAnim, {
			toValue: 0.98,
			duration: theme.animation.fast,
			easing: Easing.out(Easing.quad),
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		setIsPressed(false);
		Animated.timing(scaleAnim, {
			toValue: 1,
			duration: theme.animation.fast,
			easing: Easing.out(Easing.quad),
			useNativeDriver: true,
		}).start();
	};

	const handleHeartPress = () => {
		Animated.sequence([
			Animated.timing(heartScale, {
				toValue: 1.2,
				duration: theme.animation.fast,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(heartScale, {
				toValue: 1,
				duration: theme.animation.fast,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
		]).start();
		toggleFavorite(product.id);
	};

	const handleAddPress = () => {
		Animated.sequence([
			Animated.timing(addScale, {
				toValue: 1.3,
				duration: theme.animation.fast,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.timing(addScale, {
				toValue: 1,
				duration: theme.animation.fast,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
		]).start();
		onAdd?.();
	};

	const isFav = isFavorite(product.id);
	const rating = (product.rating ?? (product.attributes as any)?.rating ?? 4.8);

	return (
		<Animated.View style={{ 
			width: '48%', 
			opacity: 1,
			transform: [{ scale: scaleAnim }]
		}}>
			<Pressable 
				onPress={onPress} 
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				android_ripple={{ color: theme.colors.accentLight }} 
				style={[
					{
						backgroundColor: 'white',
						borderRadius: 20,
						padding: theme.spacing(1.5),
						width: '100%',
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: isPressed ? theme.colors.accentLight : theme.colors.border,
						transform: [{ scale: isPressed ? 0.98 : 1 }],
					}
				]}
			>            
				<View style={{ position: 'relative' }}>
					<View style={{ 
						backgroundColor: theme.colors.neutralSoft,
						borderRadius: 16,
						height: large ? 150 : 110,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: theme.spacing(1.25),
						overflow: 'hidden',
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						{images.length > 0 ? (
							<>
								<FlatList
									horizontal
									pagingEnabled
									showsHorizontalScrollIndicator={false}
									data={images}
									keyExtractor={(uri, idx) => uri + idx}
									renderItem={({ item }) => (
										<Image
											source={{ uri: getFullImageUrl(String(item)) }}
											style={{ width: large ? 150 : 110, height: large ? 150 : 110 }}
											resizeMode="cover"
										/>
									)}
									onMomentumScrollEnd={e => {
										const idx = Math.round(e.nativeEvent.contentOffset.x / (large ? 150 : 110));
										setImgIdx(idx);
									}}
									getItemLayout={(data, index) => (
										{length: large ? 150 : 110, offset: (large ? 150 : 110) * index, index}
									)}
									style={{ width: large ? 150 : 110 }}
								/>
								{/* Dots */}
								<View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 2, position: 'absolute', bottom: 2, left: 0, right: 0, zIndex: 2 }}>
									{images.map((_, idx) => (
										<View key={idx} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: idx === imgIdx ? theme.colors.primary : '#ddd', marginHorizontal: 2 }} />
									))}
								</View>
							</>
						) : (
							<Ionicons name="image-outline" size={48} color={theme.colors.subtext} />
						)}
					</View>

					{/* Favorite Badge */}
					{isFav ? (
						<View style={{
							position: 'absolute',
							left: 8,
							top: 8,
							backgroundColor: 'rgba(255,255,255,0.95)',
							borderRadius: 10,
							paddingHorizontal: 8,
							paddingVertical: 4,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 4,
							borderWidth: 1,
							borderColor: theme.colors.accentLight,
							...theme.shadow.button,
						}}>
							<Ionicons name="heart" size={12} color={theme.colors.accent} />
							<Text style={{ 
								color: theme.colors.accent, 
								...theme.font.labelSmall 
							}}>
								Favorito
							</Text>
						</View>
					) : null}

					{/* Heart Button */}
					<Animated.View style={{ 
						position: 'absolute', 
						right: 8, 
						top: 8,
						transform: [{ scale: heartScale }]
					}}>
						<Pressable 
							onPress={handleHeartPress}
							style={{
								backgroundColor: 'rgba(255,255,255,0.95)',
								borderRadius: 10,
								padding: 6,
								borderWidth: 1,
								borderColor: isFav ? theme.colors.accentLight : theme.colors.borderLight,
								...theme.shadow.button,
							}}
						>
							<Ionicons 
								name={isFav ? 'heart' : 'heart-outline'} 
								size={16} 
								color={isFav ? theme.colors.accent : theme.colors.subtext} 
							/>
						</Pressable>
					</Animated.View>
				</View>

				{/* Product Info */}
				<View style={{ flex: 1 }}>
					<Text 
						numberOfLines={2} 
						style={{ 
							...theme.font.label,
							color: theme.colors.text,
							marginBottom: theme.spacing(0.5),
						}}
					>
						{product.name}
					</Text>

					{/* Price and Rating Row */}
					<View style={{ 
						flexDirection: 'row', 
						alignItems: 'center', 
						justifyContent: 'space-between',
						marginTop: theme.spacing(0.5)
					}}>
						<Text style={{ 
							color: theme.colors.text, 
							...theme.font.h4,
							fontWeight: '800'
						}}>
							MT {product.price.toFixed(2)}
						</Text>

						{/* Rating */}
						<View style={{ 
							flexDirection: 'row', 
							alignItems: 'center', 
							gap: 4,
							backgroundColor: theme.colors.accentSoft,
							paddingHorizontal: 6,
							paddingVertical: 2,
							borderRadius: 10,
						}}>
							<Ionicons name="star" size={12} color={theme.colors.accent} />
							<Text style={{ 
								color: theme.colors.accent, 
								...theme.font.labelSmall,
								fontWeight: '700'
							}}>
								{rating.toFixed(1)}
							</Text>
						</View>
					</View>

					{/* Add Button */}
					<View style={{ 
						alignItems: 'flex-end',
						marginTop: theme.spacing(0.75)
					}}>
						<Animated.View style={{ transform: [{ scale: addScale }] }}>
							<Pressable 
								onPress={handleAddPress}
								style={{
									backgroundColor: theme.colors.accent,
									borderRadius: theme.radii.full,
									padding: 8,
									...theme.shadow.button,
								}}
							>
								<Ionicons name="add" size={16} color="white" />
							</Pressable>
						</Animated.View>
					</View>
				</View>
			</Pressable>
		</Animated.View>
	);
}


