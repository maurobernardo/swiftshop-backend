/**
 * Utilitários para manipulação de URLs de imagens
 */

import { api } from '../api/client';

/**
 * Obtém a base URL configurada na API
 */
function getBaseUrl(): string {
	// @ts-ignore - acessando propriedade interna do axios
	return api.defaults.baseURL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8888';
}

/**
 * Converte uma URL relativa em URL absoluta
 * Se a URL já for absoluta (começa com http), retorna como está
 */
export function getFullImageUrl(url: string | null | undefined): string | undefined {
	if (!url) return undefined;
	
	// Se já é uma URL completa, retorna
	if (url.startsWith('http://') || url.startsWith('https://')) {
		console.log('[ImageUtils] URL já é absoluta:', url);
		return url;
	}
	
	const BASE_URL = getBaseUrl();
	let fullUrl: string;
	
	// Se é uma URL relativa, converte para absoluta
	if (url.startsWith('/')) {
		fullUrl = `${BASE_URL}${url}`;
	} else {
		// Se não tem barra inicial, adiciona
		fullUrl = `${BASE_URL}/${url}`;
	}
	
	console.log('[ImageUtils] URL convertida:', url, '→', fullUrl);
	return fullUrl;
}

/**
 * Converte um array de URLs relativas em URLs absolutas
 */
export function getFullImageUrls(urls: string[] | null | undefined): string[] {
	if (!urls || !Array.isArray(urls)) return [];
	return urls.map(url => getFullImageUrl(url)).filter((url): url is string => !!url);
}

