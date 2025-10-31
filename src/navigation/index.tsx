import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import InitialLoadingScreen from '../screens/InitialLoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CatalogScreen from '../screens/client/CatalogScreen';
import ProductDetailScreen from '../screens/client/ProductDetailScreen';
import CartScreen from '../screens/client/CartScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';
import OrdersScreen from '../screens/client/OrdersScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import EditProfileScreen from '../screens/client/EditProfileScreen';
import TrackingScreen from '../screens/client/TrackingScreen';
import SupportScreen from '../screens/client/SupportScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import FeedbackScreen from '../screens/settings/FeedbackScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import AdminUsersScreen from '../screens/admin/UsersScreen';
import SupportInbox from '../screens/admin/SupportInbox';
import ChatScreen from '../screens/admin/ChatScreen';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import { CartProvider } from '../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarShowLabel: true,
				tabBarStyle: { backgroundColor: 'white', height: 80, paddingBottom: 8, paddingTop: 8 },
				tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
				tabBarActiveTintColor: theme.colors.accent,
				tabBarInactiveTintColor: '#9CA3AF',
				tabBarIcon: ({ color, size, focused }) => {
					const map: any = { 'Catálogo': 'home', 'Carrinho': 'cart', 'Pedidos': 'receipt', 'Perfil': 'person' };
					const name = map[route.name] || 'ellipse';
					return <Ionicons name={name as any} size={24} color={color} />;
				},
			})}
		>
			<Tab.Screen name="Catálogo" component={CatalogScreen} />
			<Tab.Screen name="Carrinho" component={CartScreen} />
			<Tab.Screen name="Pedidos" component={OrdersScreen} />
			<Tab.Screen name="Perfil" component={ProfileScreen} />
			<Tab.Screen 
				name="Configurações" 
				component={SettingsScreen} 
				options={{ 
					tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
					tabBarLabel: 'Configurações'
				}} 
			/>
		</Tab.Navigator>
	);
}

function ClientStack() {
	const Client = createNativeStackNavigator();
	return (
        <Client.Navigator
            screenOptions={({ navigation }) => ({
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
                headerRight: () => (
                    <Pressable onPress={() => navigation.navigate('Suporte')} style={{ paddingHorizontal: 8 }}>
                        <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.text} />
                    </Pressable>
                ),
            })}
        >
			<Client.Screen name="Home" component={ClientTabs} options={{ headerShown: false }} />
			<Client.Screen name="Detalhe" component={ProductDetailScreen} options={{ title: 'Details' }} />
			<Client.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
            <Client.Screen name="Rastreamento" component={TrackingScreen} options={{ title: 'Rastreamento' }} />
            <Client.Screen name="Suporte" component={SupportScreen} options={{ title: 'Suporte' }} />
            <Client.Screen name="EditarPerfil" component={EditProfileScreen} options={{ headerShown: false }} />
            <Client.Screen name="Perfil" component={ProfileEditScreen} options={{ title: 'Editar Perfil' }} />
            <Client.Screen name="Ajuda" component={HelpSupportScreen} options={{ title: 'Ajuda e Suporte' }} />
            <Client.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Enviar Feedback' }} />
            <Client.Screen name="Sobre" component={AboutScreen} options={{ title: 'Sobre o App' }} />
		</Client.Navigator>
	);
}

function AdminTabs() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: true,
				tabBarStyle: { height: 80, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: 'white', paddingBottom: 8, paddingTop: 8 },
				tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
				tabBarActiveTintColor: theme.colors.accent,
				tabBarInactiveTintColor: '#9CA3AF',
			}}
		>
            <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="speedometer" size={22} color={color} /> }} />
            <Tab.Screen name="Produtos" component={AdminProductsScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="cube" size={22} color={color} /> }} />
			<Tab.Screen name="Pedidos" component={AdminOrdersScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} /> }} />
			<Tab.Screen name="Usuários" component={AdminUsersScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} />
			<Tab.Screen name="Atendimento" component={SupportInbox} options={{ tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={22} color={color} /> }} />
		</Tab.Navigator>
	);
}

function AdminStack() {
	const Admin = createNativeStackNavigator();
	const { logout } = useAuth();
	return (
		<Admin.Navigator>
			<Admin.Screen
				name="AdminHome"
				component={AdminTabs}
				options={{
					title: 'Admin',
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Pressable onPress={() => {/* @ts-ignore */}} style={{ paddingHorizontal: 8 }}>
                                {/* Placeholder to preserve spacing */}
                            </Pressable>
                            <Pressable onPress={() => {/* navigate to support from root */}} style={{ paddingHorizontal: 8 }}>
                                <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.text} />
                            </Pressable>
                            <Pressable onPress={logout} style={{ paddingHorizontal: 8 }}>
                                <Ionicons name="log-out-outline" size={22} color={theme.colors.text} />
                            </Pressable>
                        </View>
                    ),
				}}
			/>
			<Admin.Screen
				name="ChatScreen"
				component={ChatScreen}
				options={{
					title: 'Chat',
					headerShown: true,
				}}
			/>
		</Admin.Navigator>
	);
}

export default function RootNavigation() {
	const { token, role, loading } = useAuth();

	if (loading) {
		return (
			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
				<Text>Carregando...</Text>
			</View>
		);
	}

	return (
		<CartProvider>
			<NavigationContainer
				theme={DefaultTheme}
				fallback={
					<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
						<ActivityIndicator size={40} />
					</View>
				}
			>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					{!token ? (
						<>
							<Stack.Screen name="Welcome" component={InitialLoadingScreen} />
							<Stack.Screen name="Login" component={LoginScreen} />
							<Stack.Screen name="Register" component={RegisterScreen} />
						</>
					) : role === 'admin' ? (
						<Stack.Screen name="Admin" component={AdminStack} />
					) : (
						<Stack.Screen name="Client" component={ClientStack} />
					)}
				</Stack.Navigator>
			</NavigationContainer>
		</CartProvider>
	);
}
