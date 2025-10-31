import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View, Animated, Easing } from 'react-native';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { listMyMessages, sendMyMessage } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Message { id: string; from: 'me' | 'agent'; text: string; at: number }
type LocalMessage = Message & { _status?: 'sending' | 'failed' };

const FAQ = [
    { 
        q: 'Como rastrear meu pedido?', 
        a: 'Abra o pedido e toque em "Rastreamento".',
        icon: 'car' as const,
        color: theme.colors.accent,
        bgColor: theme.colors.accentSoft
    },
    { 
        q: 'Quais formas de pagamento?', 
        a: 'Cartão, M-Pesa, E-Mola e PayPal.',
        icon: 'card' as const,
        color: theme.colors.success,
        bgColor: theme.colors.positiveSoft
    },
    { 
        q: 'Como alterar endereço?', 
        a: 'Perfil → Seus dados → Editar endereço.',
        icon: 'location' as const,
        color: theme.colors.warning,
        bgColor: theme.colors.warningSoft
    },
    { 
        q: 'Como cancelar pedido?', 
        a: 'Entre em contato conosco o mais rápido possível.',
        icon: 'close-circle' as const,
        color: theme.colors.error,
        bgColor: theme.colors.errorSoft
    },
    { 
        q: 'Qual o prazo de entrega?', 
        a: 'De 2 a 5 dias úteis para a maioria das regiões.',
        icon: 'time' as const,
        color: theme.colors.info,
        bgColor: theme.colors.infoSoft
    },
    { 
        q: 'Como devolver produto?', 
        a: 'Entre em contato em até 7 dias após o recebimento.',
        icon: 'return-up-back' as const,
        color: theme.colors.accent,
        bgColor: theme.colors.accentSoft
    },
    { 
        q: 'Como usar cupom?', 
        a: 'No carrinho, digite o código do cupom na área de desconto.',
        icon: 'pricetag' as const,
        color: theme.colors.success,
        bgColor: theme.colors.positiveSoft
    },
    { 
        q: 'Como criar conta?', 
        a: 'Toque em "Criar conta" na tela de login e preencha os dados.',
        icon: 'person-add' as const,
        color: theme.colors.info,
        bgColor: theme.colors.infoSoft
    },
];

export default function SupportScreen({ route }: any) {
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [input, setInput] = useState('');
    const [suggested, setSuggested] = useState<string | null>(null);

    const { token } = useAuth();
    const orderId = (route?.params && typeof route.params.orderId === 'number') ? route.params.orderId : undefined;

    // Somente REST: bootstrap e polling incremental (afterId)
    useEffect(() => {
        let mounted = true;
        let timer: any; let lastId: number | null = null;
        const load = async (initial = false) => {
            try {
                const rows = await listMyMessages(orderId, initial ? { limit: 50 } : (lastId ? { afterId: lastId } : { limit: 50 }));
                if (!mounted) return;
                const mapped: LocalMessage[] = rows.map(r => ({ id: String(r.id), from: r.from_role === 'admin' ? 'agent' : 'me', text: r.text, at: new Date(r.created_at).getTime() }));
                if (initial) {
                    setMessages(mapped);
                } else if (mapped.length) {
                    setMessages((prev) => [...prev, ...mapped]);
                }
                if (rows.length) lastId = rows[rows.length - 1].id;
            } catch (error) {
                console.log('Erro ao carregar mensagens:', error);
                // Adicionar mensagem de boas-vindas se não há mensagens
                if (initial && messages.length === 0) {
                    setMessages([{
                        id: 'welcome',
                        from: 'agent',
                        text: 'Olá! Como posso ajudar você hoje?',
                        at: Date.now()
                    }]);
                }
            }
        };
        const tick = async () => {
            await load(false);
            if (mounted) timer = setTimeout(tick, 3000);
        };
        load(true).then(() => { if (mounted) tick(); });
        return () => { mounted = false; if (timer) clearTimeout(timer); };
    }, [token, orderId]);

    // Adicionar mensagem de boas-vindas se não há mensagens
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage: LocalMessage = {
                id: 'welcome-' + Date.now(),
                from: 'agent',
                text: 'Olá! Como posso ajudar você hoje? 😊',
                at: Date.now()
            };
            setMessages([welcomeMessage]);
        }
    }, []);

    const sendText = async (text: string, autoReplyText?: string) => {
        const t = text.trim();
        if (!t) return;
        const tempId = String(Date.now());
        const mine: LocalMessage = { id: tempId, from: 'me', text: t, at: Date.now(), _status: 'sending' };
        setMessages((m) => [...m, mine]);
        try {
            await sendMyMessage(t, orderId, undefined, autoReplyText);
            setMessages((m) => m.map(x => x.id === tempId ? { ...x, _status: undefined } : x));
        } catch {
            setMessages((m) => m.map(x => x.id === tempId ? { ...x, _status: 'failed' } : x));
        }
    };

    const send = () => {
        void sendText(input);
        setInput('');
        setSuggested(null);
    };

    const retrySend = async (m: LocalMessage) => {
        if (m.from !== 'me') return;
        setMessages((prev) => prev.map(x => x.id === m.id ? { ...x, _status: 'sending' } : x));
        try {
            await sendMyMessage(m.text, orderId);
            setMessages((prev) => prev.map(x => x.id === m.id ? { ...x, _status: undefined } : x));
        } catch {
            setMessages((prev) => prev.map(x => x.id === m.id ? { ...x, _status: 'failed' } : x));
        }
    };

    const loadOlder = async () => {
        if (loadingOlder) return;
        setLoadingOlder(true);
        try {
            const numericIds = messages.map(m => Number(m.id)).filter(n => Number.isFinite(n));
            const minId = numericIds.length ? Math.min(...numericIds) : undefined;
            const rows = await listMyMessages(orderId, minId ? { beforeId: minId, limit: 50 } : { limit: 50 });
            const mapped: LocalMessage[] = rows.map(r => ({ id: String(r.id), from: r.from_role === 'admin' ? 'agent' : 'me', text: r.text, at: new Date(r.created_at).getTime() }));
            if (mapped.length === 0) {
                setHasMoreOlder(false);
            } else {
                setMessages(prev => [...mapped, ...prev]);
            }
        } catch {}
        setLoadingOlder(false);
    };

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

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
                easing: Easing.out(Easing.quad),
               useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
        }}>
            {/* Header */}
            <LinearGradient
                colors={[theme.colors.accent, '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    paddingHorizontal: theme.spacing(3),
                    paddingVertical: theme.spacing(4),
                    paddingTop: theme.spacing(6),
                    ...theme.shadow.card,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[theme.font.h2, { color: 'white', fontWeight: '800' }]}>
                            Suporte SwiftShop
                        </Text>
                        <Text style={[theme.font.body, { color: 'rgba(255,255,255,0.9)', marginTop: theme.spacing(0.5) }]}>
                            Estamos aqui para ajudar você! 💜
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(2),
                        ...theme.shadow.button,
                    }}>
                        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                    </View>
                </View>
            </LinearGradient>

            {/* FAQ Cards */}
            <View style={{ padding: theme.spacing(3), backgroundColor: 'white', marginTop: -theme.spacing(2), borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, ...theme.shadow.card }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) }}>
                    <View style={{
                        backgroundColor: theme.colors.accentSoft,
                        borderRadius: theme.radii.full,
                        padding: theme.spacing(1),
                        marginRight: theme.spacing(1.5),
                    }}>
                        <Ionicons name="help-circle" size={16} color={theme.colors.accent} />
                    </View>
                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '700' }]}>
                        Perguntas frequentes
                    </Text>
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ gap: theme.spacing(2) }}
                >
                {FAQ.map((f, i) => (
                        <Pressable 
                            key={i} 
                            onPress={() => { setInput(f.q); setSuggested(f.a); sendText(f.q, f.a); }} 
                            style={{ 
                                width: 160, 
                                backgroundColor: 'white', 
                                borderWidth: 1, 
                                borderColor: f.bgColor, 
				borderRadius: 24,
                                padding: theme.spacing(2.5),
                                ...theme.shadow.button,
                            }}
                        >
                            <View style={{ 
                                alignItems: 'center', 
                                marginBottom: theme.spacing(1.5),
                            }}>
                                <View style={{
                                    backgroundColor: f.bgColor,
                                    borderRadius: theme.radii.full,
                                    padding: theme.spacing(1.5),
                                    marginBottom: theme.spacing(1),
                                    ...theme.shadow.button,
                                }}>
                                    <Ionicons name={f.icon} size={20} color={f.color} />
                                </View>
                                <Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700', textAlign: 'center' }]} numberOfLines={2}>
                                    {f.q}
                                </Text>
                            </View>
                            <Text style={[theme.font.bodySmall, { color: theme.colors.subtext, textAlign: 'center', lineHeight: 18 }]} numberOfLines={3}>
                                {f.a}
                            </Text>
                    </Pressable>
                ))}
            </ScrollView>
            </View>

            {/* Load More Button */}
            {hasMoreOlder && (
                <View style={{ paddingHorizontal: theme.spacing(3), marginBottom: theme.spacing(1) }}>
                    <Pressable 
                        onPress={loadOlder} 
                        disabled={loadingOlder} 
                        style={{ 
                            alignSelf: 'center', 
                            paddingHorizontal: theme.spacing(3), 
                            paddingVertical: theme.spacing(2), 
                            borderRadius: theme.radii.full, 
                            borderWidth: 1, 
                            borderColor: theme.colors.borderLight, 
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.spacing(1),
                            ...theme.shadow.button,
                        }}
                    >
                        <Ionicons name={loadingOlder ? "refresh" : "chevron-up"} size={16} color={theme.colors.accent} />
                        <Text style={[theme.font.label, { color: theme.colors.accent, fontWeight: '700' }]}>
                            {loadingOlder ? 'Carregando…' : 'Ver mensagens anteriores'}
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Chat Messages */}
            <FlatList
                style={{ flex: 1, backgroundColor: theme.colors.background }}
                contentContainerStyle={{ 
                    padding: theme.spacing(2), 
                    paddingBottom: theme.spacing(1),
                    flexGrow: 1,
                }}
                data={messages}
                keyExtractor={(m) => m.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const isMe = item.from === 'me';
                    const bubble = (
                        <View style={{ 
                            maxWidth: '85%', 
                            backgroundColor: isMe ? theme.colors.accent : 'white', 
				borderRadius: 24,
                            padding: theme.spacing(3),
                            borderWidth: 1,
                            borderColor: isMe ? theme.colors.accent : theme.colors.borderLight,
                            ...theme.shadow.button,
                        }}>
                            <Text style={{ 
                                color: isMe ? 'white' : theme.colors.text,
                                ...theme.font.body,
                                lineHeight: 22,
                            }}>
                                {item.text}
                            </Text>
                            
                            {isMe && item._status === 'sending' && (
                                <View style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    marginTop: theme.spacing(1),
                                    gap: theme.spacing(0.5)
                                }}>
                                    <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={[theme.font.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                                        Enviando…
                                    </Text>
                                </View>
                            )}
                            
                            {isMe && item._status === 'failed' && (
                                <View style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    marginTop: theme.spacing(1),
                                    gap: theme.spacing(0.5)
                                }}>
                                    <Ionicons name="alert-circle" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={[theme.font.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                                        Falhou. Toque para reenviar.
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                    
                    const content = isMe && item._status === 'failed'
                        ? (<Pressable onPress={() => void retrySend(item)}>{bubble}</Pressable>)
                        : bubble;
                        
                    return (
                        <View style={{ 
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: theme.spacing(2),
                            paddingHorizontal: theme.spacing(1),
                        }}>
                            {!isMe && (
                                <View style={{
                                    backgroundColor: theme.colors.accentSoft,
                                    borderRadius: theme.radii.full,
                                    width: 36,
                                    height: 36,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: theme.spacing(1.5),
                                    marginBottom: theme.spacing(0.5),
                                    ...theme.shadow.button,
                                }}>
                                    <Ionicons name="headset" size={18} color={theme.colors.accent} />
                                </View>
                            )}
                            <View style={{ flex: isMe ? 0 : 1, maxWidth: '85%' }}>
                                {content}
                            </View>
                            {isMe && (
                                <View style={{
                                    backgroundColor: theme.colors.accent,
                                    borderRadius: theme.radii.full,
                                    width: 36,
                                    height: 36,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginLeft: theme.spacing(1.5),
                                    marginBottom: theme.spacing(0.5),
                                    ...theme.shadow.button,
                                }}>
                                    <Ionicons name="person" size={18} color="white" />
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ 
                        alignItems: 'center', 
                        padding: theme.spacing(5),
                        backgroundColor: 'white',
				borderRadius: 24,
                        margin: theme.spacing(2),
                        ...theme.shadow.card,
                    }}>
                        <LinearGradient
                            colors={[theme.colors.accentSoft, theme.colors.accent + '20']}
                            style={{
                                borderRadius: theme.radii.full,
                                padding: theme.spacing(4),
                                marginBottom: theme.spacing(3),
                                ...theme.shadow.button,
                            }}
                        >
                            <Ionicons name="chatbubble-ellipses" size={48} color={theme.colors.accent} />
                        </LinearGradient>
                        <Text style={[theme.font.h3, { color: theme.colors.text, marginBottom: theme.spacing(1), fontWeight: '800' }]}>
                            Olá! 👋
                        </Text>
                        <Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', lineHeight: 22 }]}>
                            Escolha uma pergunta acima ou escreva sua mensagem para começar nossa conversa
                        </Text>
                        <Text style={[theme.font.caption, { color: theme.colors.subtext, textAlign: 'center', marginTop: theme.spacing(2) }]}>
                            Total de mensagens: {messages.length}
                        </Text>
                    </View>
                }
            />

            {/* Input Area */}
            <View style={{ 
                padding: theme.spacing(3), 
                borderTopWidth: 1, 
                borderTopColor: theme.colors.borderLight, 
                backgroundColor: 'white',
                ...theme.shadow.card,
            }}>
                <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'flex-end', 
                    gap: theme.spacing(2),
                    backgroundColor: 'white',
				borderRadius: 24,
                    borderWidth: 2,
                    borderColor: theme.colors.borderLight,
                    padding: theme.spacing(2),
                    ...theme.shadow.button,
                }}>
                    <View style={{ 
                        flex: 1, 
                        backgroundColor: theme.colors.neutralSoft,
					borderRadius: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.borderLight,
                        paddingHorizontal: theme.spacing(2),
                        paddingVertical: theme.spacing(1),
                    }}>
                        <TextInput 
                            placeholder="Digite sua mensagem..." 
                            value={input} 
                            onChangeText={setInput} 
                            placeholderTextColor={theme.colors.subtext} 
                            style={{ 
                                padding: theme.spacing(2),
                                ...theme.font.body,
                                maxHeight: 100,
                                color: theme.colors.text,
                            }}
                            multiline
                        />
                    </View>
                    <Pressable 
                        onPress={send} 
                        style={{ 
                            backgroundColor: theme.colors.accent, 
                            borderRadius: theme.radii.full, 
                            width: 48,
                            height: 48,
                            justifyContent: 'center',
                            alignItems: 'center',
                            ...theme.shadow.button,
                        }}
                    >
                        <Ionicons name="send" size={22} color="white" />
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
}





