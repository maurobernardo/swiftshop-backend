import { api } from './client';

export interface Reports {
    totals: { users: number; orders: number; products: number; revenue: number; visits: number };
    orders_by_day: { date: string; orders: number }[];
    revenue_by_day: { date: string; revenue: number }[];
    visits_by_day: { date: string; visits?: number }[];
    order_statuses: Record<string, number>;
    top_products: { name: string; revenue: number }[];
}

export async function fetchReports(days: number = 30): Promise<Reports> {
    const res = await api.get('/admin/reports', { params: { days } });
    return res.data;
}


