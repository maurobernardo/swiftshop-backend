import { api } from './client';
import { Order, OrderStatus } from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateOrderItem { product_id: number; quantity: number }

export async function createOrder(items: CreateOrderItem[]): Promise<Order> {
	const res = await api.post('/orders', { items });
	return res.data;
}

export async function listOrders(): Promise<Order[]> {
	const res = await api.get('/orders');
	return res.data;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
	const res = await api.put(`/orders/${orderId}/status`, null, { params: { status_value: status } });
	return res.data;
}

export async function deleteOrder(orderId: number): Promise<void> {
	await api.delete(`/orders/${orderId}`);
}

export async function downloadReceipt(orderId: number): Promise<void> {
	// Mobile (React Native)
	if (Platform.OS === 'ios' || Platform.OS === 'android') {
		try {
			// Obter token de autenticação
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				throw new Error('Token de autenticação não encontrado. Faça login novamente.');
			}

			const filename = `recibo_pedido_${orderId}.pdf`;
			const fileUri = FileSystem.documentDirectory + filename;
			const downloadUrl = `${api.defaults.baseURL}/orders/${orderId}/receipt`;

			console.log('[DOWNLOAD] URL:', downloadUrl);
			console.log('[DOWNLOAD] Salvando em:', fileUri);

			// Fazer download do PDF
			const downloadResult = await FileSystem.downloadAsync(
				downloadUrl,
				fileUri,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			console.log('[DOWNLOAD] Status:', downloadResult.status);
			console.log('[DOWNLOAD] URI:', downloadResult.uri);

			// Compartilhar o arquivo (permite salvar/abrir)
			if (downloadResult.status === 200) {
				const canShare = await Sharing.isAvailableAsync();
				if (!canShare) {
					throw new Error('Compartilhamento não disponível neste dispositivo');
				}

				await Sharing.shareAsync(downloadResult.uri, {
					mimeType: 'application/pdf',
					dialogTitle: 'Recibo do Pedido',
					UTI: 'com.adobe.pdf'
				});
			} else {
				throw new Error(`Erro ao baixar recibo. Status: ${downloadResult.status}`);
			}
		} catch (error: any) {
			console.error('[DOWNLOAD] Erro:', error);
			throw error;
		}
	} 
	// Web (navegador)
	else {
		const res = await api.get(`/orders/${orderId}/receipt`, {
			responseType: 'blob'
		});
		
		const url = window.URL.createObjectURL(new Blob([res.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', `recibo_pedido_${orderId}.pdf`);
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(url);
	}
}

