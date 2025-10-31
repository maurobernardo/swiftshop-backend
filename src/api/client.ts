import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================
// Para PRODUÇÃO (deploy): Defina EXPO_PUBLIC_API_URL no .env ou variáveis de ambiente
// Exemplo: EXPO_PUBLIC_API_URL=https://swiftshop-backend.onrender.com
//
// Para DESENVOLVIMENTO LOCAL:
// Altere LOCAL_NETWORK_IP para o IP da sua máquina na rede local
// Execute "ipconfig" (Windows) ou "ifconfig" (Linux/Mac) para ver seu IP
// ============================================================================
const LOCAL_NETWORK_IP = '172.16.21.145'; // ← IP da sua máquina na rede local
const BACKEND_PORT = '8888'; // Porta do backend local

// URL padrão para desenvolvimento local
const defaultBaseURL = Platform.select({
	ios: `http://${LOCAL_NETWORK_IP}:${BACKEND_PORT}`,
	android: `http://${LOCAL_NETWORK_IP}:${BACKEND_PORT}`,
	default: `http://${LOCAL_NETWORK_IP}:${BACKEND_PORT}`,
});

// Prioriza variável de ambiente (produção), senão usa URL local (desenvolvimento)
const baseURL = process.env.EXPO_PUBLIC_API_URL || defaultBaseURL;

// Log baseURL once to help diagnose connectivity on devices
// eslint-disable-next-line no-console
console.log('[API] baseURL =', baseURL);

export const api = axios.create({
	baseURL,
	timeout: 10000,
});

// Interceptor para adicionar token e logs detalhados
api.interceptors.request.use(async (config) => {
	console.log('[API] 📡 Fazendo requisição:', config.method?.toUpperCase(), config.url);
	console.log('[API] 🌐 URL completa:', (config.baseURL || '') + (config.url || ''));
	
	const token = await AsyncStorage.getItem('token');
	if (token) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `Bearer ${token}`;
		console.log('[API] 🔑 Token adicionado');
	}
	return config;
}, (error) => {
	console.log('[API] ❌ Erro no request interceptor:', error);
	return Promise.reject(error);
});

// Interceptor para logs de resposta
api.interceptors.response.use(
	(response) => {
		console.log('[API] ✅ Resposta recebida:', response.status, response.config.url);
		return response;
	},
	(error) => {
		if (error.response) {
			console.log('[API] ❌ Erro na resposta:', error.response.status, error.response.data);
		} else if (error.request) {
			console.log('[API] ❌ Sem resposta do servidor. Verifique:');
			console.log('   - Backend está rodando?');
			console.log('   - IP correto:', baseURL);
			console.log('   - Firewall liberado?');
			console.log('   - Mesma rede Wi-Fi?');
			console.log('[API] 🔧 Detalhes do erro:', error.message);
		} else {
			console.log('[API] ❌ Erro ao configurar requisição:', error.message);
		}
		return Promise.reject(error);
	}
);
