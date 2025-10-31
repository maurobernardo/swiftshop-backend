import { api } from './client';

export async function createPaypalOrder(totalUSD: number): Promise<{ id: string; links?: any[] }> {
    const res = await api.post('/payments/paypal/create', null, { params: { total_value: totalUSD } });
    return res.data;
}

export async function capturePaypalOrder(orderId: string): Promise<any> {
    const res = await api.post(`/payments/paypal/capture/${orderId}`);
    return res.data;
}


