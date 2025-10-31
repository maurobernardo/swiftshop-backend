export type UserRole = 'admin' | 'client';

export interface User {
	id: number;
	name: string;
	email: string;
	role: UserRole;
	is_blocked: number;
    avatar_url?: string | null;
    phone?: string | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    street?: string | null;
    number?: string | null;
    reference?: string | null;
}

export interface Product {
	id: number;
	name: string;
	price: number;
	description?: string | null;
	image_url?: string | null;
	image_urls?: string[] | null;
	size_images?: Record<string, string[]> | null;  // {"42": ["url1", "url2"], "43": ["url3"]}
	size_colors?: Record<string, string[]> | null;  // {"42": ["azul", "preto"], "43": ["vermelho"]}
	size_stock?: Record<string, number> | null;  // {"42": 5, "43": 3}
	category?: string | null;
	stock: number;
	main_category?: string | null;
	sub_category?: string | null;
	attributes?: Record<string, any> | null;
	rating?: number | null;
}

export interface OrderItem {
	id: number;
	product_id: number;
	quantity: number;
	unit_price: number;
	product: Product;
}

export type OrderStatus = 'Pendente' | 'Processando' | 'Enviado' | 'Entregue';

export interface Order {
	id: number;
	user_id: number;
	status: OrderStatus;
	created_at: string;
	items: OrderItem[];
	user?: User;
}
