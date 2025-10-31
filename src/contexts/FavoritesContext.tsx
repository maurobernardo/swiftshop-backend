import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavorites, addFavorite, removeFavorite } from '../api/users';
import { useAuth } from './AuthContext';

interface FavoritesContextValue {
	favorites: number[];
	isFavorite: (productId: number) => boolean;
	toggleFavorite: (productId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
	const [favorites, setFavorites] = useState<number[]>([]);
	const { token } = useAuth();

	useEffect(() => {
		(async () => {
			try {
				if (token) {
					const ids = await getFavorites();
					setFavorites(ids);
					await AsyncStorage.setItem('favorites', JSON.stringify(ids));
				} else {
					const raw = await AsyncStorage.getItem('favorites');
					if (raw) setFavorites(JSON.parse(raw));
				}
			} catch {}
		})();
	}, [token]);

	useEffect(() => {
		AsyncStorage.setItem('favorites', JSON.stringify(favorites)).catch(() => {});
	}, [favorites]);

	const value = useMemo<FavoritesContextValue>(() => ({
		favorites,
		isFavorite: (id: number) => favorites.includes(id),
		toggleFavorite: (id: number) => {
			setFavorites((prev) => {
				const exists = prev.includes(id);
				const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
				AsyncStorage.setItem('favorites', JSON.stringify(next)).catch(() => {});
				if (token) {
					(exists ? removeFavorite(id) : addFavorite(id)).catch(() => {});
				}
				return next;
			});
		},
	}), [favorites, token]);

	return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
	const ctx = useContext(FavoritesContext);
	if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
	return ctx;
}


