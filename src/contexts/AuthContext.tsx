import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { User } from '../types';

export type UserRole = 'admin' | 'client';

interface AuthState {
	userId: number | null;
	role: UserRole | null;
	email: string | null;
	name: string | null;
	token: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    street?: string | null;
    number?: string | null;
    reference?: string | null;
}

interface AuthContextType extends AuthState {
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
	logout: () => Promise<void>;
	refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({ userId: null, role: null, email: null, name: null, token: null });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (token) {
					setState((s) => ({ ...s, token }));
					await refreshMe(token);
				}
			} catch (e) {
				// ignore and continue
			} finally {
				setLoading(false);
			}
		})();
	}, []);

    const refreshMe = async (tokenOverride?: string) => {
		const token = tokenOverride ?? state.token;
		if (!token) return;
		try {
            const res = await api.get('/auth/me');
            const me = res.data as User;
            setState((s) => ({
                ...s,
                userId: me.id,
                name: me.name,
                email: me.email,
                role: me.role,
                avatarUrl: me.avatar_url ?? null,
                phone: me.phone ?? null,
                country: me.country ?? null,
                state: me.state ?? null,
                city: me.city ?? null,
                street: me.street ?? null,
                number: me.number ?? null,
                reference: me.reference ?? null,
            }));
		} catch (e) {
			// token inválido: limpar mas não travar a UI
			await AsyncStorage.removeItem('token');
			setState({ userId: null, role: null, email: null, name: null, token: null });
		}
	};

	const login = async (email: string, password: string) => {
		const res = await api.post('/auth/login', { email, password });
		const { access_token, role, user_id } = res.data as { access_token: string; role: UserRole; user_id: number };
		await AsyncStorage.setItem('token', access_token);
		setState({ token: access_token, role, userId: user_id, email, name: state.name });
		await refreshMe(access_token);
	};

    const register = async (
        name: string,
        email: string,
        password: string,
        role: UserRole = 'client',
        extras?: {
            phone?: string;
            country?: string;
            state?: string;
            city?: string;
            street?: string;
            number?: string;
            reference?: string;
        }
    ) => {
        await api.post('/auth/register', { name, email, password, role, ...(extras || {}) });
		await login(email, password);
	};

	const logout = async () => {
		await AsyncStorage.removeItem('token');
		setState({ userId: null, role: null, email: null, name: null, token: null });
	};

	const value = useMemo<AuthContextType>(() => ({ ...state, loading, login, register, logout, refreshMe }), [state, loading]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
};
