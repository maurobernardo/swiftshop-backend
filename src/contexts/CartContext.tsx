import React, { createContext, useContext, useMemo, useState } from 'react';
import { Product } from '../types';

export interface CartLine {
	product: Product;
	quantity: number;
	selectedSize?: string; // Tamanho selecionado (ex: "42", "M", "G")
	selectedColor?: string; // Cor selecionada (ex: "Azul", "Preto")
}

interface CartContextType {
	lines: CartLine[];
	subtotal: number;
	addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
	removeFromCart: (productId: number, size?: string) => void;
	setQuantity: (productId: number, quantity: number, size?: string) => void;
	clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [lines, setLines] = useState<CartLine[]>([]);

	const addToCart = (product: Product, quantity: number = 1, size?: string, color?: string) => {
		setLines((prev) => {
			// Procura se já existe o mesmo produto COM O MESMO TAMANHO
			const idx = prev.findIndex((l) => 
				l.product.id === product.id && 
				l.selectedSize === size
			);
			
			if (idx >= 0) {
				// Se já existe, apenas aumenta a quantidade
				const next = [...prev];
				next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
				return next;
			}
			
			// Se não existe, adiciona novo item com tamanho e cor
			return [...prev, { 
				product, 
				quantity, 
				selectedSize: size, 
				selectedColor: color 
			}];
		});
	};

	const removeFromCart = (productId: number, size?: string) => {
		setLines((prev) => prev.filter((l) => 
			!(l.product.id === productId && (size === undefined || l.selectedSize === size))
		));
	};

	const setQuantity = (productId: number, quantity: number, size?: string) => {
		setLines((prev) => prev.map((l) => 
			(l.product.id === productId && (size === undefined || l.selectedSize === size)) 
				? { ...l, quantity } 
				: l
		));
	};

	const clearCart = () => setLines([]);

	const subtotal = useMemo(() => lines.reduce((s, l) => s + l.product.price * l.quantity, 0), [lines]);

	const value = useMemo(() => ({ lines, subtotal, addToCart, removeFromCart, setQuantity, clearCart }), [lines, subtotal]);
	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error('useCart must be used within CartProvider');
	return ctx;
};






















