import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface Props { route: any }

// Mock de posições/estado; em produção, buscar da API do pedido
const STATUS_ORDER = ['Pendente', 'Processando', 'Enviado', 'A Caminho', 'Entregue'] as const;

export default function TrackingScreen({ route }: Props) {
    const { orderId = 0, status = 'A Caminho', courierPhone = '' } = route.params || {};
    const currentIndex = Math.max(0, STATUS_ORDER.indexOf(status as any));

    const timeline = useMemo(() => STATUS_ORDER.map((s, i) => ({ label: s, done: i <= currentIndex })), [currentIndex]);

    const openWhatsApp = () => {
        if (!courierPhone) return;
        const url = `https://wa.me/${courierPhone.replace(/\D/g,'')}`;
        Linking.openURL(url).catch(() => {});
    };

    const openSupport = () => Linking.openURL('mailto:suporte@swiftshop.local');

    const mapsUrl = 'https://www.openstreetmap.org'; // placeholder; integrar provider real

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView contentContainerStyle={{ padding: theme.spacing(2), paddingBottom: theme.spacing(3), gap: theme.spacing(2) }}>
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.colors.border }}>
                    <Text style={{ fontWeight: '800' }}>Pedido #{orderId}</Text>
                    <Text style={{ color: theme.colors.subtext, marginTop: 4 }}>Status atual: {status}</Text>
                </View>

                {/* Timeline */}
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.colors.border }}>
                    <Text style={{ fontWeight: '800', marginBottom: 8 }}>Linha do tempo</Text>
                    {timeline.map((t, i) => (
                        <View key={t.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <Ionicons name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={t.done ? theme.colors.positive : theme.colors.subtext} />
                            <Text style={{ fontWeight: t.done ? '700' : '500', color: t.done ? theme.colors.primary : theme.colors.subtext }}>{t.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Mapa (preview/link) */}
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.colors.border }}>
                    <Text style={{ fontWeight: '800', marginBottom: 8 }}>Rastreamento</Text>
                    <View style={{ height: 180, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: theme.colors.subtext }}>Mapa em tempo real (placeholder)</Text>
                    </View>
                    <Pressable onPress={() => Linking.openURL(mapsUrl)} style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: theme.colors.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border }}>
                        <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>Abrir no mapa</Text>
                    </Pressable>
                </View>

                {/* Contatos */}
                <View style={{ backgroundColor: 'white', borderRadius: theme.radii.lg, padding: 14, borderWidth: 1, borderColor: theme.colors.border, gap: 10 }}>
                    <Text style={{ fontWeight: '800' }}>Suporte / Entregador</Text>
                    <Pressable onPress={openWhatsApp} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="logo-whatsapp" size={18} color={theme.colors.positive} />
                        <Text style={{ fontWeight: '700' }}>Falar no WhatsApp</Text>
                    </Pressable>
                    <Pressable onPress={openSupport} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="help-circle-outline" size={18} color={theme.colors.accent} />
                        <Text style={{ fontWeight: '700' }}>Falar com suporte</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}












