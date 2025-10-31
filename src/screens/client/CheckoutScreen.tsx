import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View, Linking } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import AnimatedButton from '../../components/AnimatedButton';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedCard from '../../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { createOrder } from '../../api/orders';

type PaymentMethod = 'card' | 'mpesa' | 'emola' | 'paypal' | 'qr' | 'face';

export default function CheckoutScreen({ navigation }: any) {
    const { lines, subtotal, clearCart } = useCart();
    const auth = useAuth();
    const [method, setMethod] = useState<PaymentMethod>('card');
    const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '' });
    const [reference, setReference] = useState('');

    const shipping = useMemo(() => (subtotal >= 200 ? 0 : (lines.length ? 19.9 : 0)), [subtotal, lines.length]);
    const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

    const placeOrder = async () => {
        if (!lines.length) {
            Alert.alert('Carrinho', 'Seu carrinho está vazio.');
            return;
        }
        if (method === 'paypal') {
            try {
                // Conversão MZN->USD via taxa configurável
                const rate = Number(process.env.EXPO_PUBLIC_USD_RATE || '63'); // ex.: 1 USD = 63 MZN (ajustar)
                const totalMZN = total; // todo em MZN
                const usd = Math.max(1, Math.round((totalMZN / rate) * 100) / 100);
                const { id, links } = await (await import('../../api/payments')).createPaypalOrder(usd);
                const approve = (links || []).find((l: any) => l.rel === 'approve')?.href;
                if (approve) {
                    const returnUrl = 'swiftshop://paypal-return';
                    const urlWithReturn = approve.includes('return_url') ? approve : `${approve}&return_url=${encodeURIComponent(returnUrl)}`;
                    const sub = Linking.addEventListener('url', async ({ url }) => {
                        if (!url) return;
                        if (url.includes('paypal-return')) {
                            // @ts-ignore - remove is available in current RN
                            if (sub && typeof (sub as any).remove === 'function') (sub as any).remove();
                            try {
                                await (await import('../../api/payments')).capturePaypalOrder(id);
                                
                                // Criar pedido no backend
                                const orderItems = lines.map(line => ({
                                    product_id: line.product.id,
                                    quantity: line.quantity
                                }));
                                
                                const order = await createOrder(orderItems);
                                clearCart();
                                
                                Alert.alert(
                                    'Pagamento', 
                                    'Pagamento PayPal confirmado!',
                                    [
                                        {
                                            text: 'Ver Pedidos',
                                            onPress: () => navigation.navigate('Pedidos')
                                        }
                                    ]
                                );
                            } catch (error) {
                                console.error('Erro ao processar pagamento PayPal:', error);
                                Alert.alert('Pagamento', 'Falha ao capturar pagamento.');
                            }
                        }
                    });
                    await Linking.openURL(urlWithReturn);
                } else {
                    Alert.alert('PayPal', 'Não foi possível obter link de aprovação.');
                }
            } catch (e: any) {
                Alert.alert('PayPal', e?.response?.data?.detail || 'Falha ao criar pagamento');
            }
            return;
        }

        // Criar pedido no backend
        try {
            const orderItems = lines.map(line => ({
                product_id: line.product.id,
                quantity: line.quantity
            }));
            
            console.log('Criando pedido com items:', orderItems);
            const order = await createOrder(orderItems);
            console.log('Pedido criado:', order);
            clearCart();
            
            Alert.alert(
                'Pagamento', 
                `Compra confirmada via ${method.toUpperCase()}. Total MT ${total.toFixed(2)}`,
                [
                    {
                        text: 'Ver Pedidos',
                        onPress: () => navigation.navigate('Pedidos')
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            Alert.alert('Erro', 'Falha ao criar pedido. Tente novamente.');
        }
    };

    const Row = ({ left, right }: { left: string; right: string }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: theme.colors.subtext }}>{left}</Text>
            <Text style={{ fontWeight: '700' }}>{right}</Text>
        </View>
    );

    const addressLine = useMemo(() => {
        const parts = [auth.street, auth.number, auth.city, auth.state, auth.country].filter(Boolean);
        return parts.join(', ');
    }, [auth.street, auth.number, auth.city, auth.state, auth.country]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <AnimatedScreen scrollable>
            <View style={{ padding: theme.spacing(2), paddingBottom: theme.spacing(2), gap: theme.spacing(2) }}>
                {/* Resumo do pedido */}
                <AnimatedCard style={{ padding: 14 }}>
                    <Text style={{ fontWeight: '800', marginBottom: 6 }}>Resumo</Text>
                    {lines.map((l) => (
                        <View key={l.product.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 }}>
                                {l.product.image_url ? (
                                    <Image source={{ uri: String(l.product.image_url) }} style={{ width: 54, height: 40, borderRadius: 10 }} />
                                ) : null}
                                <View style={{ flex: 1 }}>
                                    <Text numberOfLines={1} style={{ fontWeight: '600' }}>{l.product.name}</Text>
                                    <Text style={{ color: theme.colors.subtext }}>Qtd: {l.quantity}</Text>
                                </View>
                            </View>
                            <Text style={{ fontWeight: '700' }}>MT {(l.product.price * l.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                    <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 10 }} />
                    <Row left="Subtotal" right={`MT ${subtotal.toFixed(2)}`} />
                    <Row left="Frete" right={shipping === 0 ? 'Grátis' : `MT ${shipping.toFixed(2)}`} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <Text style={{ fontWeight: '800' }}>Total</Text>
                        <Text style={{ fontWeight: '800', fontSize: 18 }}>MT {total.toFixed(2)}</Text>
                    </View>
                </AnimatedCard>

                {/* Endereços */}
                <AnimatedCard style={{ padding: 14 }} delay={100}>
                    <Text style={{ fontWeight: '800', marginBottom: 6 }}>Entrega e Fatura</Text>
                    <Text style={{ color: theme.colors.text }}>{auth.name}</Text>
                    <Text style={{ color: theme.colors.subtext }}>{addressLine || 'Sem endereço cadastrado'}</Text>
                    {auth.reference ? <Text style={{ color: theme.colors.subtext }}>Ref: {auth.reference}</Text> : null}
                    <Pressable onPress={() => navigation.navigate('Perfil')} style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: theme.colors.accentSoft, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border }}>
                        <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>Editar endereço</Text>
                    </Pressable>
                </AnimatedCard>

                {/* Pagamento */}
                <AnimatedCard style={{ padding: 14 }} delay={200}>
                    <Text style={{ fontWeight: '800', marginBottom: 6 }}>Pagamento</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {([
                            { key: 'card', label: 'Cartão', icon: 'card' },
                            { key: 'mpesa', label: 'M-Pesa', icon: 'logo-usd' },
                            { key: 'emola', label: 'E-Mola', icon: 'cash' },
                            { key: 'paypal', label: 'PayPal', icon: 'logo-paypal' },
                            { key: 'qr', label: 'QR Code', icon: 'qr-code' },
                            { key: 'face', label: 'FaceID', icon: 'scan' },
                        ] as { key: PaymentMethod; label: string; icon: any }[]).map((m) => (
                            <Pressable key={m.key} onPress={() => setMethod(m.key)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: method === m.key ? theme.colors.accent : theme.colors.border, backgroundColor: method === m.key ? theme.colors.accentSoft : 'white', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name={m.icon} size={16} color={method === m.key ? theme.colors.accent : theme.colors.text} />
                                <Text style={{ fontWeight: '700', color: method === m.key ? theme.colors.accent : theme.colors.text }}>{m.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Card form */}
                    {method === 'card' ? (
                        <View style={{ marginTop: 10, gap: 8 }}>
                            <TextInput placeholder="Número do cartão" value={card.number} onChangeText={(t) => setCard((c) => ({ ...c, number: t }))} keyboardType="number-pad" placeholderTextColor={theme.colors.subtext} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: 'white', padding: 10 }} />
                            <TextInput placeholder="Nome impresso" value={card.name} onChangeText={(t) => setCard((c) => ({ ...c, name: t }))} placeholderTextColor={theme.colors.subtext} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: 'white', padding: 10 }} />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput placeholder="MM/AA" value={card.exp} onChangeText={(t) => setCard((c) => ({ ...c, exp: t }))} placeholderTextColor={theme.colors.subtext} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: 'white', padding: 10 }} />
                                </View>
                                <View style={{ width: 120 }}>
                                    <TextInput placeholder="CVV" value={card.cvv} onChangeText={(t) => setCard((c) => ({ ...c, cvv: t }))} keyboardType="number-pad" placeholderTextColor={theme.colors.subtext} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: 'white', padding: 10 }} />
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {/* M-Pesa / E-Mola reference */}
                    {method === 'mpesa' || method === 'emola' ? (
                        <View style={{ marginTop: 10 }}>
                            <TextInput placeholder="Número/Referência" value={reference} onChangeText={setReference} keyboardType="number-pad" placeholderTextColor={theme.colors.subtext} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: 'white', padding: 10 }} />
                        </View>
                    ) : null}

                    {/* QR Code placeholder */}
                    {method === 'qr' ? (
                        <View style={{ marginTop: 10, alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 180, height: 180, backgroundColor: '#fff', borderWidth: 2, borderColor: theme.colors.border, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="qr-code" size={120} color={theme.colors.primary} />
                            </View>
                            <Text style={{ color: theme.colors.subtext }}>Escaneie para pagar</Text>
                        </View>
                    ) : null}

                    {/* Face recognition mock */}
                    {method === 'face' ? (
                        <View style={{ marginTop: 10, alignItems: 'center', gap: 8 }}>
                            <Ionicons name="scan-circle" size={100} color={theme.colors.accent} />
                            <Text style={{ color: theme.colors.subtext }}>Aproxime seu rosto para autenticar</Text>
                        </View>
                    ) : null}
                </AnimatedCard>
            </View>
            </AnimatedScreen>

            {/* Confirm */}
            <View style={{ padding: theme.spacing(2), borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: 'white' }}>
                <AnimatedButton 
                    title={`Pagar MT ${total.toFixed(2)}`} 
                    onPress={placeOrder}
                    fullWidth
                    icon="checkmark-circle"
                    iconPosition="right"
                />
            </View>
        </View>
    );
}


