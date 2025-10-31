import { api } from './client';
import { Product } from '../types';

export interface ProductFilters { q?: string; main_category?: string; sub_category?: string }

export async function listProducts(queryOrFilters: string | ProductFilters = ''): Promise<Product[]> {
	const params = typeof queryOrFilters === 'string' ? { q: queryOrFilters } : queryOrFilters;
	const res = await api.get('/products', { params });
	return res.data;
}

export async function getProduct(id: number): Promise<Product> {
	const res = await api.get(`/products/${id}`);
	return res.data;
}

export interface ReviewInput { rating: number; comment?: string }
export interface Review {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    comment?: string | null;
    created_at: string;
    user_name?: string;
}

export async function listReviews(productId: number): Promise<Review[]> {
    const res = await api.get(`/products/${productId}/reviews`);
    return res.data;
}

export async function createReview(productId: number, data: ReviewInput): Promise<Review> {
    const res = await api.post(`/products/${productId}/reviews`, data);
    return res.data;
}

export async function createProduct(p: any): Promise<Product> {
	const res = await api.post('/products', p);
	return res.data;
}

export async function updateProduct(id: number, p: any): Promise<Product> {
	const res = await api.put(`/products/${id}`, p);
	return res.data;
}

export async function deleteProduct(id: number): Promise<void> {
	await api.delete(`/products/${id}`);
}
