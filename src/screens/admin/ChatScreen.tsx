import React, { useEffect, useMemo, useState, useRef } from 'react';
import { FlatList, Pressable, Text, TextInput, View, Animated, ScrollView, Easing } from 'react-native';
import { theme } from '../../theme';
import { listMyMessages, sendMyMessage, SupportMessage } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';

const QUICK_REPLIES = [
    'Olá! Como posso ajudar?',
    'Seu pedido já foi separado e logo será enviado.',
    'Poderia confirmar o número do pedido?',
    'Estamos verificando e retornamos em instantes.',
];

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

type LocalMessage = SupportMessage & { _status?: 'sending' | 'failed' };

interface ChatScreenProps {
    route: {
        params: {
            userId: number;
            userName: string;
        };
    };
    navigation: any;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
    const { userId, userName } = route.params;
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [input, setInput] = useState('');
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [suggested, setSuggested] = useState<string | null>(null);
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const { token } = useAuth();
    
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
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Load messages for this user
    useEffect(() => {
        let mounted = true;
        let timer: any; let lastId: number | null = null;
        const load = async (initial = false) => {
            try {
                const rows = await listMyMessages(undefined, initial ? { userId, limit: 50 } : (lastId ? { userId, afterId: lastId, limit: 50 } : { userId, limit: 50 }));
                if (!mounted) return;
                const mapped: LocalMessage[] = rows.map(r => ({ ...r, _status: undefined }));
                if (initial) {
                    setMessages(mapped);
                } else if (mapped.length) {
                    setMessages((prev) => [...prev, ...mapped]);
                }
                if (rows.length) lastId = rows[rows.length - 1].id;
            } catch (error) {
                console.log('Erro ao carregar mensagens:', error);
            }
        };
        const tick = async () => {
            await load(false);
            if (mounted) timer = setTimeout(tick, 3000);
        };
        load(true).then(() => { if (mounted) tick(); });
        return () => { mounted = false; if (timer) clearTimeout(timer); };
    }, [token, userId]);

    const send = async () => {
        const t = input.trim();
        if (!t) return;
        const tempId = Date.now();
        const mine: LocalMessage = { id: tempId, from_role: 'admin', text: t, user_id: userId, created_at: new Date().toISOString(), _status: 'sending' };
        setMessages((m) => [...m, mine]);
        setInput('');
        try {
            await sendMyMessage({ text: t, userId });
            setMessages((prev) => prev.map(x => x.id === tempId ? { ...x, _status: undefined } : x));
        } catch {
            setMessages((prev) => prev.map(x => x.id === tempId ? { ...x, _status: 'failed' } : x));
        }
    };

    const retrySend = async (m: LocalMessage) => {
        setMessages((prev) => prev.map(x => x.id === m.id ? { ...x, _status: 'sending' } : x));
        try {
            await sendMyMessage({ text: m.text, userId });
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
            const rows = await listMyMessages(undefined, minId ? { userId, beforeId: minId, limit: 50 } : { userId, limit: 50 });
            const mapped: LocalMessage[] = rows.map(r => ({ ...r, _status: undefined }));
            if (mapped.length === 0) {
                setHasMoreOlder(false);
            } else {
                setMessages(prev => [...mapped, ...prev]);
            }
        } catch {}
        setLoadingOlder(false);
    };

    return (
        <Screen>
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
                        <Pressable 
                            onPress={() => navigation.goBack()}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: theme.radii.full,
                                padding: theme.spacing(1.5),
                                marginRight: theme.spacing(2),
                                ...theme.shadow.button,
                            }}
                        >
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </Pressable>
                        
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.font.h2, { color: 'white', fontWeight: '800' }]}>
                                Chat com {userName}
                            </Text>
                            <Text style={[theme.font.body, { color: 'rgba(255,255,255,0.9)', marginTop: theme.spacing(0.5) }]}>
                                Cliente #{userId} • Atendimento ao vivo 💜
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
                <View style={{ 
                    padding: theme.spacing(3), 
                    backgroundColor: 'white', 
                    marginTop: -theme.spacing(2), 
                    borderTopLeftRadius: theme.radii.xl, 
                    borderTopRightRadius: theme.radii.xl, 
                    ...theme.shadow.card 
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(3) }}>
                        <LinearGradient
                            colors={[theme.colors.accentSoft, theme.colors.accent + '20']}
                            style={{
                                borderRadius: theme.radii.full,
                                padding: theme.spacing(1.5),
                                marginRight: theme.spacing(2),
                                ...theme.shadow.button,
                            }}
                        >
                            <Ionicons name="flash" size={18} color={theme.colors.accent} />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                                Respostas rápidas
                            </Text>
                            <Text style={[theme.font.bodySmall, { color: theme.colors.subtext }]}>
                                Toque para usar uma resposta pré-definida
                            </Text>
                        </View>
                    </View>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={{ 
                            gap: theme.spacing(2.5),
                            paddingHorizontal: theme.spacing(1)
                        }}
                    >
                        {FAQ.slice(0, 6).map((f, i) => (
                            <Pressable
                                key={i}
                                onPress={() => setInput(f.a)}
                                style={({ pressed }) => ({
                                    width: 180,
                                    backgroundColor: 'white',
                                    borderWidth: 2,
                                    borderColor: pressed ? f.color : f.bgColor,
						borderRadius: 24,
                                    padding: theme.spacing(3),
                                    ...theme.shadow.card,
                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                })}
                            >
                                <LinearGradient
                                    colors={[f.bgColor, f.bgColor + '80']}
                                    style={{
                                        borderRadius: theme.radii.full,
                                        width: 40,
                                        height: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: theme.spacing(2),
                                        ...theme.shadow.button,
                                    }}
                                >
                                    <Ionicons name={f.icon} size={20} color={f.color} />
                                </LinearGradient>
                                <Text style={[theme.font.label, { 
                                    color: theme.colors.text, 
                                    fontWeight: '700', 
                                    marginBottom: theme.spacing(1),
                                    lineHeight: 18
                                }]}>
                                    {f.q}
                                </Text>
                                <Text style={[theme.font.bodySmall, { 
                                    color: theme.colors.subtext, 
                                    lineHeight: 18,
                                    opacity: 0.9
                                }]}>
                                    {f.a}
                                </Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: theme.spacing(1.5),
                                    gap: theme.spacing(0.5)
                                }}>
                                    <Ionicons name="arrow-forward" size={12} color={f.color} />
                                    <Text style={[theme.font.caption, { 
                                        color: f.color, 
                                        fontWeight: '600' 
                                    }]}>
                                        Usar resposta
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Load More Button */}
                {hasMoreOlder && (
                    <View style={{ paddingHorizontal: theme.spacing(2) }}>
                        <Pressable 
                            onPress={loadOlder}
                            disabled={loadingOlder}
                            style={{ 
                                alignSelf: 'center', 
                                marginBottom: theme.spacing(1), 
                                paddingHorizontal: theme.spacing(2), 
                                paddingVertical: theme.spacing(1), 
                                borderRadius: theme.radii.md, 
                                borderWidth: 1, 
                                borderColor: theme.colors.borderLight, 
                                backgroundColor: 'white',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: theme.spacing(1),
                                ...theme.shadow.button
                            }}
                        >
                            <Ionicons name={loadingOlder ? "refresh" : "arrow-up"} size={14} color={theme.colors.text} />
                            <Text style={[theme.font.bodySmall, { color: theme.colors.text }]}>
                                {loadingOlder ? 'Carregando…' : 'Ver mensagens anteriores'}
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* Messages */}
                <FlatList
                    style={{ flex: 1, backgroundColor: theme.colors.background }}
                    contentContainerStyle={{ 
                        padding: theme.spacing(2), 
                        paddingBottom: theme.spacing(1),
                        flexGrow: 1,
                    }}
                    data={messages}
                    keyExtractor={(m) => String(m.id)}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isAdmin = item.from_role === 'admin';
                        const bubble = (
                            <View style={{ 
                                maxWidth: '85%', 
                                backgroundColor: isAdmin ? theme.colors.accent : 'white', 
						borderRadius: 24,
                                padding: theme.spacing(3),
                                borderWidth: 1,
                                borderColor: isAdmin ? theme.colors.accent : theme.colors.borderLight,
                                ...theme.shadow.button,
                            }}>
                                <Text style={[theme.font.body, { 
                                    color: isAdmin ? 'white' : theme.colors.text,
                                    lineHeight: 22,
                                }]}>
                                    {item.text}
                                </Text>
                                
                                {isAdmin && item._status === 'sending' && (
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
                                
                                {isAdmin && item._status === 'failed' && (
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
                        
                        const content = isAdmin && item._status === 'failed'
                            ? (<Pressable onPress={() => void retrySend(item)}>{bubble}</Pressable>)
                            : bubble;
                            
                        return (
                            <View style={{ 
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                                marginBottom: theme.spacing(2),
                                paddingHorizontal: theme.spacing(1),
                            }}>
                                {!isAdmin && (
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
                                        <Ionicons name="person" size={18} color={theme.colors.accent} />
                                    </View>
                                )}
                                <View style={{ flex: isAdmin ? 0 : 1, maxWidth: '85%' }}>
                                    {content}
                                </View>
                                {isAdmin && (
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
                                        <Ionicons name="headset" size={18} color="white" />
                                    </View>
                                )}
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', padding: theme.spacing(5) }}>
                            <LinearGradient
                                colors={[theme.colors.accentSoft, theme.colors.accent + '20']}
                                style={{
                                    borderRadius: theme.radii.full,
                                    padding: theme.spacing(4),
                                    marginBottom: theme.spacing(3),
                                    ...theme.shadow.button,
                                }}
                            >
                                <Ionicons name="chatbubble-outline" size={48} color={theme.colors.accent} />
                            </LinearGradient>
                            <Text style={[theme.font.h3, { color: theme.colors.text, marginBottom: theme.spacing(1), fontWeight: '800' }]}>
                                Olá! 👋
                            </Text>
                            <Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', lineHeight: 22 }]}>
                                Escolha uma resposta rápida acima ou escreva sua mensagem para começar nossa conversa
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
                    ...theme.shadow.card
                }}>
                    <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        borderWidth: 2, 
                        borderColor: theme.colors.borderLight, 
						borderRadius: 24,
                        padding: theme.spacing(2),
                        gap: theme.spacing(2)
                    }}>
                        <View style={{ 
                            flex: 1, 
                            backgroundColor: theme.colors.neutralSoft, 
                            borderRadius: theme.radii.lg, 
                            borderWidth: 1, 
                            borderColor: theme.colors.borderLight,
                        }}>
                            <TextInput 
                                placeholder="Digite sua resposta..." 
                                value={input} 
                                onChangeText={setInput} 
                                placeholderTextColor={theme.colors.subtext} 
                                style={{ 
                                    padding: theme.spacing(2),
                                    ...theme.font.body,
                                    color: theme.colors.text,
                                    maxHeight: 100,
                                    multiline: true,
                                }} 
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
                                ...theme.shadow.button
                            }}
                        >
                            <Ionicons name="send" size={22} color="white" />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </Screen>
    );
}