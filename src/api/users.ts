import { api } from './client';
export async function getFavorites(): Promise<number[]> { const res = await api.get('/favorites'); return res.data; }
export async function addFavorite(productId: number): Promise<void> { await api.post(`/favorites/${productId}`); }
export async function removeFavorite(productId: number): Promise<void> { await api.delete(`/favorites/${productId}`); }
import { User } from '../types';

export async function me(): Promise<User> {
	const res = await api.get('/auth/me');
	return res.data;
}

export async function listUsers(): Promise<User[]> {
	const res = await api.get('/users');
	return res.data;
}

export async function createAdminUser(name: string, email: string, password: string): Promise<User> {
	const res = await api.post('/users/admin', { name, email, password });
	return res.data;
}

export async function deleteUser(userId: number): Promise<void> {
	await api.delete(`/users/${userId}`);
}

export async function updateMe(data: Partial<User>): Promise<User> {
    const res = await api.put('/auth/me', data as any);
    return res.data;
}

export interface SupportMessage { id: number; user_id: number; order_id?: number | null; from_role: string; text: string; created_at: string }
export async function listMyMessages(orderId?: number, opts?: { userId?: number; limit?: number; afterId?: number; beforeId?: number }): Promise<SupportMessage[]> {
    const params: any = { order_id: orderId };
    if (opts?.userId != null) params.user_id = opts.userId;
    if (opts?.limit != null) params.limit = opts.limit;
    if (opts?.afterId != null) params.after_id = opts.afterId;
    if (opts?.beforeId != null) params.before_id = opts.beforeId;
    const res = await api.get('/support/messages', { params });
    return res.data;
}
export async function sendMyMessage(text: string, orderId?: number, targetUserId?: number, autoReplyText?: string): Promise<SupportMessage> {
    const res = await api.post('/support/messages', { text, order_id: orderId ?? null, target_user_id: targetUserId ?? null, auto_reply_text: autoReplyText ?? null });
    return res.data;
}


