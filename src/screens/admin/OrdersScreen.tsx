import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View, Animated, ScrollView, Image } from 'react-native';
import { deleteOrder, listOrders, updateOrderStatus } from '../../api/orders';
import { Order, OrderStatus } from '../../types';
import { theme } from '../../theme';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const statuses: OrderStatus[] = ['Pendente', 'Processando', 'Enviado', 'Entregue'];

export default function AdminOrdersScreen() {
	const [items, setItems] = useState<Order[]>([]);
	const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Order | null>(null);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'Todos'>('Todos');
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

	const refresh = async () => {
		setLoading(true);
		try {
			setItems(await listOrders());
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { refresh(); }, []);
	
	// Initial animation
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();
	}, []);

	const cycleStatus = async (o: Order) => {
		const idx = statuses.indexOf(o.status);
		const next = statuses[(idx + 1) % statuses.length];
		try {
			await updateOrderStatus(o.id, next);
			await refresh();
		} catch (e: any) {
			Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao atualizar status');
		}
	};

	const onDelete = async (id: number) => {
		try {
			await deleteOrder(id);
			await refresh();
		} catch (e: any) {
			Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao excluir');
		}
	};

	const filtered = items.filter((o) => {
		if (statusFilter !== 'Todos' && o.status !== statusFilter) return false;
		if (!query.trim()) return true;
		const q = query.toLowerCase();
		return String(o.id).includes(q);
	});

	const sumOrder = (o: Order) => o.items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);

	const getStatusConfig = (status: OrderStatus) => {
		const configs = {
			'Pendente': { color: theme.colors.warning, bgColor: theme.colors.warningSoft, icon: 'time' },
			'Processando': { color: theme.colors.info, bgColor: theme.colors.infoSoft, icon: 'cog' },
			'Enviado': { color: theme.colors.accent, bgColor: theme.colors.accentSoft, icon: 'car' },
			'Entregue': { color: theme.colors.success, bgColor: theme.colors.positiveSoft, icon: 'checkmark-circle' },
		};
		return configs[status];
	};

	const StatusChip = ({ status }: { status: OrderStatus }) => {
		const config = getStatusConfig(status);
		return (
			<View style={{
				backgroundColor: config.bgColor,
				borderRadius: theme.radii.full,
				paddingVertical: theme.spacing(1),
				paddingHorizontal: theme.spacing(2),
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.spacing(1),
				...theme.shadow.button,
			}}>
				<Ionicons name={config.icon as any} size={14} color={config.color} />
				<Text style={[theme.font.labelSmall, { color: config.color, fontWeight: '700' }]}>
					{status}
				</Text>
			</View>
		);
	};

    return (
        <Animated.View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
        }}>
            <Screen title="Pedidos" right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
                    <View style={{
                        backgroundColor: theme.colors.accentSoft,
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(1.5),
                        ...theme.shadow.button,
                    }}>
                        <Ionicons name="list" size={16} color={theme.colors.accent} />
                    </View>
                    <Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
                        {filtered.length} pedidos
                    </Text>
                </View>
            }>
                <View style={{ gap: theme.spacing(3) }}>
                    {/* Search and Filters */}
                    <View style={{
                        backgroundColor: 'white',
					borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.borderLight,
                        padding: theme.spacing(3),
                        ...theme.shadow.card,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(2) }}>
                            <Ionicons name="search" size={20} color={theme.colors.subtext} />
                            <TextInput 
                                placeholder="Buscar por #ID do pedido" 
                                value={query} 
                                onChangeText={setQuery} 
                                placeholderTextColor={theme.colors.subtext} 
                                style={{ 
                                    flex: 1,
                                    ...theme.font.body,
                                    color: theme.colors.text
                                }} 
                            />
                        </View>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: theme.spacing(2) }}>
                            <View style={{ flexDirection: 'row', gap: theme.spacing(2) }}>
					{(['Todos', ...statuses] as const).map((st) => (
                                    <Pressable 
                                        key={String(st)} 
                                        onPress={() => setStatusFilter(st as any)} 
                                        style={{
                                            paddingHorizontal: theme.spacing(3),
                                            paddingVertical: theme.spacing(1.5),
                                            borderRadius: theme.radii.full,
                                            borderWidth: 1,
                                            borderColor: statusFilter === st ? theme.colors.accent : theme.colors.borderLight,
                                            backgroundColor: statusFilter === st ? theme.colors.accentSoft : 'white',
                                            ...theme.shadow.button,
                                        }}
                                    >
                                        <Text style={[theme.font.labelSmall, { 
                                            color: statusFilter === st ? theme.colors.accent : theme.colors.subtext,
                                            fontWeight: '700'
                                        }]}>
                                            {String(st)}
                                        </Text>
						</Pressable>
					))}
				</View>
                        </ScrollView>
			</View>

                    {/* Orders List */}
            <FlatList
                        contentContainerStyle={{ paddingTop: 0, gap: theme.spacing(2) }}
				data={filtered}
				keyExtractor={(o) => String(o.id)}
                        renderItem={({ item }) => {
                            const firstProduct = item.items[0]?.product;
                            const clientName = item.user?.name || 'Cliente';
                            const orderDate = new Date(item.created_at).toLocaleDateString('pt-BR');
                            
                            return (
                                <Animated.View style={{
                                    backgroundColor: 'white',
					borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: theme.colors.borderLight,
                                    padding: theme.spacing(3),
                                    ...theme.shadow.card,
                                }}>
                        <Pressable onPress={() => setSelected(item)}>
                                        <View style={{ flexDirection: 'row', gap: theme.spacing(3), marginBottom: theme.spacing(3) }}>
                                            {/* Product Image */}
                                            <View style={{
                                                width: 60,
                                                height: 60,
                                                backgroundColor: theme.colors.neutralSoft,
					borderRadius: 20,
                                                overflow: 'hidden',
                                                ...theme.shadow.button,
                                            }}>
                                                {firstProduct?.image_url ? (
                                                    <Image 
                                                        source={{ uri: firstProduct.image_url }} 
                                                        style={{ width: '100%', height: '100%' }} 
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                        <Ionicons name="cube-outline" size={20} color={theme.colors.subtext} />
                                                    </View>
                                                )}
                                            </View>
                                            
                                            {/* Order Info */}
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing(1) }}>
                                                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                                                        Pedido #{item.id}
                                                    </Text>
                                                    <StatusChip status={item.status} />
                                                </View>
                                                
                                                <Text style={[theme.font.body, { color: theme.colors.subtext, marginBottom: theme.spacing(0.5) }]}>
                                                    Cliente: {clientName}
                                                </Text>
                                                
                                                <Text style={[theme.font.body, { color: theme.colors.subtext, marginBottom: theme.spacing(0.5) }]}>
                                                    {firstProduct?.name || 'Produto'}
                                                </Text>
                                                
                                                <Text style={[theme.font.body, { color: theme.colors.subtext, marginBottom: theme.spacing(0.5) }]}>
                                                    {item.items.length} {item.items.length === 1 ? 'item' : 'itens'} • {orderDate}
                                                </Text>
                                                
                                                <Text style={[theme.font.h4, { color: theme.colors.accent, fontWeight: '800' }]}>
                                                    MT {sumOrder(item).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={{ flexDirection: 'row', gap: theme.spacing(2) }}>
                                            <Pressable 
                                                onPress={() => cycleStatus(item)}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: theme.colors.accent,
					borderRadius: 20,
                                                    paddingVertical: theme.spacing(2),
                                                    paddingHorizontal: theme.spacing(3),
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: theme.spacing(1),
                                                    ...theme.shadow.button,
                                                }}
                                            >
                                                <Ionicons name="arrow-forward" size={16} color="white" />
                                                <Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
                                                    Avançar
                                                </Text>
                                            </Pressable>
                                            
                                            <Pressable 
                                                onPress={() => onDelete(item.id)}
                                                style={{
                                                    backgroundColor: theme.colors.errorSoft,
					borderRadius: 20,
                                                    padding: theme.spacing(2),
                                                    ...theme.shadow.button,
                                                }}
                                            >
                                                <Ionicons name="trash" size={16} color={theme.colors.error} />
                                            </Pressable>
                                </View>
                        </Pressable>
                                </Animated.View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', padding: theme.spacing(4) }}>
                                <Ionicons name="receipt-outline" size={48} color={theme.colors.subtext} />
                                <Text style={[theme.font.h4, { color: theme.colors.text, marginTop: theme.spacing(2), textAlign: 'center' }]}>
                                    Nenhum pedido encontrado
                                </Text>
                                <Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', marginTop: theme.spacing(1) }]}>
                                    {query || statusFilter !== 'Todos' ? 'Tente ajustar sua busca' : 'Aguardando novos pedidos'}
                                </Text>
                            </View>
                        }
                    />
                </View>
            </Screen>
            <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
                <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {/* Header */}
                    <View style={{
                        padding: theme.spacing(4),
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.borderLight,
                        backgroundColor: 'white',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        ...theme.shadow.card,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
                            <View style={{
                                backgroundColor: theme.colors.accent,
                                borderRadius: theme.radii.full,
                                padding: theme.spacing(1.5),
                                ...theme.shadow.button,
                            }}>
                                <Ionicons name="receipt" size={20} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '800' }]}>
                                    Pedido #{selected?.id}
                                </Text>
                                <Text style={[theme.font.body, { color: theme.colors.subtext }]}>
                                    Cliente: {selected?.user?.name || 'Cliente'}
                                </Text>
                                <Text style={[theme.font.body, { color: theme.colors.subtext }]}>
                                    Total: MT {selected ? sumOrder(selected).toFixed(2) : '0.00'}
                                </Text>
                            </View>
                        </View>
                        <Pressable 
                            onPress={() => setSelected(null)}
                            style={{
                                backgroundColor: theme.colors.errorSoft,
                                borderRadius: theme.radii.full,
                                padding: theme.spacing(1.5),
                                ...theme.shadow.button,
                            }}
                        >
                            <Ionicons name="close" size={16} color={theme.colors.error} />
                        </Pressable>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        <View style={{ padding: theme.spacing(3), gap: theme.spacing(3) }}>
                            {/* Status Section */}
                            <View style={{
                                backgroundColor: 'white',
					borderRadius: 20,
                                padding: theme.spacing(3),
                                ...theme.shadow.card,
                            }}>
                                <Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
                                    Status do Pedido
                                </Text>
                                <View style={{ flexDirection: 'row', gap: theme.spacing(2), flexWrap: 'wrap' }}>
                            {statuses.map((st) => (
                                        <Pressable 
                                            key={st} 
                                            onPress={async () => { 
                                                if (!selected) return; 
                                                try { 
                                                    await updateOrderStatus(selected.id, st); 
                                                    await refresh(); 
                                                    setSelected((s) => (s ? { ...s, status: st } : s)); 
                                                } catch (e: any) { 
                                                    Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao alterar status'); 
                                                } 
                                            }} 
                                            style={{
                                                paddingHorizontal: theme.spacing(3),
                                                paddingVertical: theme.spacing(2),
					borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: selected?.status === st ? theme.colors.accent : theme.colors.borderLight,
                                                backgroundColor: selected?.status === st ? theme.colors.accentSoft : 'white',
                                                ...theme.shadow.button,
                                            }}
                                        >
                                            <Text style={[theme.font.label, { 
                                                color: selected?.status === st ? theme.colors.accent : theme.colors.subtext,
                                                fontWeight: '700'
                                            }]}>
                                                {st}
                                            </Text>
                                </Pressable>
                            ))}
                        </View>
                            </View>

                            {/* Items Section */}
                            <View style={{
                                backgroundColor: 'white',
					borderRadius: 20,
                                padding: theme.spacing(3),
                                ...theme.shadow.card,
                            }}>
                                <Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
                                    Itens do Pedido
                                </Text>
                                <View style={{ gap: theme.spacing(2) }}>
                        {(selected?.items || []).map((it) => (
                                        <View key={it.id} style={{
                                            backgroundColor: theme.colors.neutralSoft,
					borderRadius: 20,
                                            padding: theme.spacing(3),
                                            borderWidth: 1,
                                            borderColor: theme.colors.borderLight,
                                            ...theme.shadow.button,
                                        }}>
                                            <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
                                                {/* Product Image */}
                                                <View style={{
                                                    width: 50,
                                                    height: 50,
                                                    backgroundColor: theme.colors.borderLight,
					borderRadius: 20,
                                                    overflow: 'hidden',
                                                    ...theme.shadow.button,
                                                }}>
                                                    {it.product?.image_url ? (
                                                        <Image 
                                                            source={{ uri: it.product.image_url }} 
                                                            style={{ width: '100%', height: '100%' }} 
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                            <Ionicons name="cube-outline" size={16} color={theme.colors.subtext} />
                                                        </View>
                                                    )}
                                                </View>
                                                
                                                {/* Product Info */}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '700' }]}>
                                                        {it.product?.name}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing(1) }}>
                                                        <Text style={[theme.font.body, { color: theme.colors.subtext }]}>
                                                            Qtd: {it.quantity}
                                                        </Text>
                                                        <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '700' }]}>
                                                            MT {(it.unit_price).toFixed(2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={[theme.font.body, { color: theme.colors.accent, fontWeight: '700', marginTop: theme.spacing(0.5) }]}>
                                                        Subtotal: MT {((it.unit_price * it.quantity)).toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </Animated.View>
	);
}
