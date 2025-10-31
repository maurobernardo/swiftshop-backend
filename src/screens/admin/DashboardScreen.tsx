import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Dimensions, Pressable, Animated } from 'react-native';
import { theme } from '../../theme';
import { fetchReports, Reports } from '../../api/admin';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
    const [data, setData] = useState<Reports | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    const load = async () => {
        setLoading(true); setError(null);
        try { setData(await fetchReports(days)); } catch (e: any) { setError(e?.response?.data?.detail || 'Falha ao carregar'); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [days]);

    const width = Dimensions.get('window').width - 24 - 24;

    const ordersSeries = useMemo(() => (data?.orders_by_day || []).map(x => x.orders), [data]);
    const revenueSeries = useMemo(() => (data?.revenue_by_day || []).map(x => x.revenue), [data]);
    const maxOrders = Math.max(1, ...ordersSeries);
    const maxRevenue = Math.max(1, ...revenueSeries);

    // Gráfico de Pizza
    const PieChart = ({ data, size = 120 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        return (
            <View style={{ alignItems: 'center', gap: theme.spacing(2) }}>
                <View style={{ position: 'relative', width: size, height: size }}>
                    {data.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        const angle = (item.value / total) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle += angle;
                        
                        return (
                            <View
                                key={index}
                                style={{
                                    position: 'absolute',
                                    width: size,
                                    height: size,
                                    borderRadius: size / 2,
                                    borderWidth: 20,
                                    borderColor: item.color,
                                    transform: [{ rotate: `${startAngle}deg` }],
                                }}
                            />
                        );
                    })}
                    <View style={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        right: 20,
                        bottom: 20,
                        borderRadius: (size - 40) / 2,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                            {total}
                        </Text>
                        <Text style={[theme.font.caption, { color: theme.colors.subtext }]}>
                            Total
                        </Text>
                    </View>
                </View>
                
                {/* Legenda */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2), justifyContent: 'center' }}>
                    {data.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) }}>
                            <View style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: item.color,
                            }} />
                            <Text style={[theme.font.caption, { color: theme.colors.text }]}>
                                {item.label} ({item.value})
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    // Gráfico de Linha
    const LineChart = ({ data, color }: { data: number[]; color: string }) => {
        if (!data || data.length === 0) {
            return (
                <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[theme.font.body, { color: theme.colors.subtext }]}>
                        Sem dados para exibir
                    </Text>
                </View>
            );
        }

        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const range = maxValue - minValue || 1;
        
        // Calcular pontos da linha
        const points = data.map((value, index) => {
            const x = (index / Math.max(1, data.length - 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 100;
            return { x, y, value };
        });

        return (
            <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: 100,
                    backgroundColor: theme.colors.neutralSoft,
                    borderRadius: 20,
                    padding: theme.spacing(2)
                }}>
                    {/* Linhas conectando os pontos */}
                    {points.map((point, index) => {
                        if (index === 0) return null;
                        const prevPoint = points[index - 1];
                        
                        return (
                            <View
                                key={`line-${index}`}
                                style={{
                                    position: 'absolute',
                                    left: `${prevPoint.x}%`,
                                    top: `${prevPoint.y}%`,
                                    width: Math.sqrt(
                                        Math.pow((point.x - prevPoint.x) * 2, 2) + 
                                        Math.pow((point.y - prevPoint.y) * 2, 2)
                                    ),
                                    height: 2,
                                    backgroundColor: color,
                                    transformOrigin: '0 0',
                                    transform: [
                                        { 
                                            rotate: `${Math.atan2(
                                                point.y - prevPoint.y, 
                                                point.x - prevPoint.x
                                            )}rad` 
                                        }
                                    ],
                                    opacity: 0.7
                                }}
                            />
                        );
                    })}
                    
                    {/* Pontos */}
                    {points.map((point, index) => (
                        <View
                            key={`point-${index}`}
                            style={{
                                position: 'absolute',
                                left: `${point.x}%`,
                                top: `${point.y}%`,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: color,
                                transform: [{ translateX: -4 }, { translateY: -4 }],
                                ...theme.shadow.button
                            }}
                        />
                    ))}
                    
                    {/* Valores nos pontos */}
                    {points.map((point, index) => (
                        <View
                            key={`value-${index}`}
                            style={{
                                position: 'absolute',
                                left: `${point.x}%`,
                                top: `${point.y - 20}%`,
                                transform: [{ translateX: -10 }],
                                backgroundColor: color,
                                borderRadius: 10,
                                paddingHorizontal: theme.spacing(1),
                                paddingVertical: 2,
                            }}
                        >
                            <Text style={[theme.font.caption, { color: 'white', fontSize: 10 }]}>
                                {point.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: theme.spacing(3), gap: theme.spacing(3) }}>
            {/* Header */}
            <LinearGradient
                colors={[theme.colors.accent, '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    padding: theme.spacing(4),
                    borderRadius: 24,
                    marginBottom: theme.spacing(2),
                    ...theme.shadow.card
                }}
            >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[theme.font.h2, { color: 'white', fontWeight: '800' }]}>
                            Dashboard
                        </Text>
                        <Text style={[theme.font.body, { color: 'rgba(255,255,255,0.9)', marginTop: theme.spacing(0.5) }]}>
                            Visão geral do negócio
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(2),
                        ...theme.shadow.button,
                    }}>
                        <Ionicons name="analytics" size={24} color="white" />
                    </View>
                </View>
                
                {/* Time Period Selector */}
                <View style={{ flexDirection: 'row', gap: theme.spacing(2), marginTop: theme.spacing(3) }}>
                    {[7, 30, 90].map((d) => (
                        <Pressable 
                            key={d} 
                            onPress={() => setDays(d)} 
                            style={({ pressed }) => ({
                                paddingHorizontal: theme.spacing(3), 
                                paddingVertical: theme.spacing(2), 
                                borderRadius: theme.radii.full, 
                                backgroundColor: days === d ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', 
                                borderWidth: 1, 
                                borderColor: 'rgba(255,255,255,0.3)',
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                                ...theme.shadow.button
                            })}
                        >
                            <Text style={[theme.font.label, { 
                                color: 'white', 
                                fontWeight: '600',
                                textAlign: 'center'
                            }]}>
                                {d} dias
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </LinearGradient>
            {error ? <Text style={{ color: '#D14343' }}>{error}</Text> : null}
            {/* Cards */}
            <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: theme.spacing(3),
                justifyContent: 'center'
            }}>
                <Card title="Usuários" value={String(data?.totals.users ?? (loading ? '…' : 0))} icon="people" hue="#6366F1" />
                <Card title="Pedidos" value={String(data?.totals.orders ?? (loading ? '…' : 0))} icon="receipt" hue="#22C55E" />
                <Card title="Produtos" value={String(data?.totals.products ?? (loading ? '…' : 0))} icon="cube" hue="#06B6D4" />
                <Card title="Receita" value={`MT ${(data?.totals.revenue ?? 0).toFixed(2)}`} icon="cash" hue="#F59E0B" />
            </View>

            {/* Gráfico de Pizza - Status dos Pedidos */}
            <View style={{ 
                backgroundColor: 'white', 
                borderRadius: theme.radii.xl, 
                padding: theme.spacing(4),
                ...theme.shadow.card
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(3) }}>
                    <View style={{
                        backgroundColor: theme.colors.accentSoft,
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(1.5),
                        marginRight: theme.spacing(2),
                    }}>
                        <Ionicons name="pie-chart" size={18} color={theme.colors.accent} />
                    </View>
                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                        Status dos Pedidos
                    </Text>
                </View>
                <PieChart 
                    data={Object.entries(data?.order_statuses || {}).map(([label, value]) => ({
                        label: label === 'pending' ? 'Pendente' :
                               label === 'confirmed' ? 'Confirmado' :
                               label === 'shipped' ? 'Enviado' :
                               label === 'delivered' ? 'Entregue' :
                               label === 'cancelled' ? 'Cancelado' : label,
                        value: Number(value),
                        color: label === 'pending' ? theme.colors.warning :
                               label === 'confirmed' ? theme.colors.info :
                               label === 'shipped' ? theme.colors.accent :
                               label === 'delivered' ? theme.colors.success :
                               theme.colors.error
                    }))}
                />
            </View>

            {/* Gráfico de Pizza - Top Produtos */}
            <View style={{ 
                backgroundColor: 'white', 
                borderRadius: theme.radii.xl, 
                padding: theme.spacing(4),
                ...theme.shadow.card
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(3) }}>
                    <View style={{
                        backgroundColor: theme.colors.positiveSoft,
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(1.5),
                        marginRight: theme.spacing(2),
                    }}>
                        <Ionicons name="trophy" size={18} color={theme.colors.success} />
                    </View>
                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                        Top Produtos por Receita
                    </Text>
                </View>
                <PieChart 
                    data={(data?.top_products || []).slice(0, 4).map((product, index) => ({
                        label: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
                        value: Math.round(product.revenue),
                        color: index === 0 ? theme.colors.accent :
                               index === 1 ? theme.colors.success :
                               index === 2 ? theme.colors.warning :
                               theme.colors.info
                    }))}
                />
            </View>

            {/* Gráfico de Pizza - Pedidos por Dia (Últimos 7 dias) */}
            <View style={{ 
                backgroundColor: 'white', 
                borderRadius: theme.radii.xl, 
                padding: theme.spacing(4),
                ...theme.shadow.card
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(3) }}>
                    <View style={{
                        backgroundColor: theme.colors.warningSoft,
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(1.5),
                        marginRight: theme.spacing(2),
                    }}>
                        <Ionicons name="calendar" size={18} color={theme.colors.warning} />
                    </View>
                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                        Pedidos por Dia (Últimos 7 dias)
                    </Text>
                </View>
                <PieChart 
                    data={(data?.orders_by_day || []).slice(-7).map((day, index) => ({
                        label: `Dia ${index + 1}`,
                        value: day.orders,
                        color: index === 0 ? theme.colors.accent :
                               index === 1 ? theme.colors.success :
                               index === 2 ? theme.colors.warning :
                               index === 3 ? theme.colors.info :
                               index === 4 ? theme.colors.error :
                               index === 5 ? theme.colors.positive :
                               theme.colors.neutral
                    }))}
                />
            </View>


            {/* Top produtos */}
            <View style={{ 
                backgroundColor: 'white', 
                borderRadius: theme.radii.xl, 
                padding: theme.spacing(4),
                ...theme.shadow.card
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(3) }}>
                    <View style={{
                        backgroundColor: theme.colors.warningSoft,
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(1.5),
                        marginRight: theme.spacing(2),
                    }}>
                        <Ionicons name="trophy" size={18} color={theme.colors.warning} />
                    </View>
                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                        Top produtos
                    </Text>
                </View>
                {(data?.top_products || []).map((p, i) => (
                    <View key={i} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        paddingVertical: theme.spacing(2),
                        paddingHorizontal: theme.spacing(2),
                        backgroundColor: i < 3 ? theme.colors.accentSoft : theme.colors.neutralSoft,
                        borderRadius: 20,
                        marginBottom: theme.spacing(1),
                        borderWidth: i < 3 ? 1 : 0,
                        borderColor: i < 3 ? theme.colors.accent : 'transparent',
                        ...theme.shadow.button
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{
                                backgroundColor: i < 3 ? theme.colors.accent : theme.colors.subtext,
                                borderRadius: theme.radii.full,
                                width: 24,
                                height: 24,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: theme.spacing(2),
                            }}>
                                <Text style={[theme.font.caption, { 
                                    color: 'white', 
                                    fontWeight: '700' 
                                }]}>
                                    {i + 1}
                                </Text>
                            </View>
                            <Text style={[theme.font.label, { 
                                color: theme.colors.text, 
                                fontWeight: '600',
                                flex: 1
                            }]}>
                                {p.name}
                            </Text>
                        </View>
                        <Text style={[theme.font.label, { 
                            color: i < 3 ? theme.colors.accent : theme.colors.subtext, 
                            fontWeight: '700' 
                        }]}>
                            MT {p.revenue.toFixed(2)}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

function Card({ title, value, hue, icon }: { title: string; value: string; hue: string; icon: string }) {
    return (
        <View style={{ 
            width: '45%', 
            backgroundColor: theme.colors.neutralSoft, 
            borderWidth: 1, 
            borderColor: theme.colors.borderLight, 
            borderRadius: theme.radii.lg, 
            padding: theme.spacing(3),
            ...theme.shadow.card,
            alignItems: 'center',
            textAlign: 'center',
        }}>
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: theme.spacing(1), 
                marginBottom: theme.spacing(1),
                justifyContent: 'center'
            }}>
                <Ionicons name={icon as any} size={18} color={hue} />
                <Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '600' }]}>
                    {title}
                </Text>
            </View>
            <Text style={[theme.font.h4, { fontWeight: '700', color: theme.colors.text, textAlign: 'center' }]}>
                {value}
            </Text>
        </View>
    );
}


