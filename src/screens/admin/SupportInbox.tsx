import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Pressable, Text, View, Animated } from 'react-native';
import { theme } from '../../theme';
import { listUsers } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';

export default function SupportInbox({ navigation }: { navigation: any }) {
    const [conversations, setConversations] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [showUserSelector, setShowUserSelector] = useState(false);
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

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
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Load users and create mock conversations
    useEffect(() => {
        const loadData = async () => {
            try {
                const userList = await listUsers();
                setUsers(userList);
                
                // Create mock conversations for now
                const mockConversations = userList.map((user, index) => ({
                    userId: user.id,
                    userName: user.name,
                    last: {
                        text: index === 0 ? 'Boa tarde, como posso ajudar?' : 
                              index === 1 ? 'Boa Tarde, Como posso ajudar?' : 
                              'Abra o pedido e toque em "Rastreamento".',
                        from_role: 'user'
                    }
                }));
                setConversations(mockConversations);
            } catch (error) {
                console.log('Erro ao carregar dados:', error);
            }
        };
        loadData();
    }, []);

    const handleConversationPress = (conversation: any) => {
        navigation.navigate('ChatScreen', {
            userId: conversation.userId,
            userName: conversation.userName
        });
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
                <View style={{
                    padding: theme.spacing(3),
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.borderLight,
                    backgroundColor: 'white',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...theme.shadow.card
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
                        <View style={{
                            backgroundColor: theme.colors.accent,
                            borderRadius: theme.radii.full,
                            padding: theme.spacing(1.5),
                            ...theme.shadow.button,
                        }}>
                            <Ionicons name="chatbubbles" size={20} color="white" />
                        </View>
                        <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                            Suporte
                        </Text>
                    </View>
                    <Pressable 
                        onPress={() => setShowUserSelector(!showUserSelector)}
                        style={{
                            backgroundColor: theme.colors.accent,
                            borderRadius: theme.radii.full,
                            padding: theme.spacing(1),
                            ...theme.shadow.button,
                        }}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        </Pressable>
            </View>

                {/* User Selector */}
                {showUserSelector && (
                    <View style={{
                        padding: theme.spacing(2),
                        backgroundColor: theme.colors.neutralSoft,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.borderLight,
                    }}>
                        <Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1), fontWeight: '600' }]}>
                            Selecionar Cliente
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) }}>
                            {users.map((user) => (
                                <Pressable
                                    key={user.id}
                                    onPress={() => {
                                        handleConversationPress({
                                            userId: user.id,
                                            userName: user.name,
                                            last: { text: 'Nova conversa', from_role: 'user' }
                                        });
                                        setShowUserSelector(false);
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: theme.radii.full,
                                        borderWidth: 1,
                                        borderColor: theme.colors.accent,
                                        paddingHorizontal: theme.spacing(2),
                                        paddingVertical: theme.spacing(1),
                                        ...theme.shadow.button
                                    }}
                                >
                                    <Text style={[theme.font.bodySmall, { color: theme.colors.accent, fontWeight: '600' }]}>
                                        {user.name}
                                    </Text>
                        </Pressable>
                    ))}
                </View>
                    </View>
                )}

                {/* Conversations List */}
                <FlatList
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                        padding: theme.spacing(2), 
                        gap: theme.spacing(2)
                    }}
                    data={conversations}
                    keyExtractor={(item) => String(item.userId)}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => handleConversationPress(item)}
                            style={{
                                backgroundColor: 'white',
				borderRadius: 20,
                                padding: theme.spacing(3),
                                borderWidth: 1,
                                borderColor: theme.colors.borderLight,
                                ...theme.shadow.card
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
                                <View style={{
                                    backgroundColor: theme.colors.accentSoft,
                                    borderRadius: theme.radii.full,
                                    padding: theme.spacing(1),
                                }}>
                                    <Ionicons name="person" size={16} color={theme.colors.accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[theme.font.label, { fontWeight: '700', color: theme.colors.text }]}>
                                        {item.userName}
                                    </Text>
                                    {item.last ? (
                                        <Text numberOfLines={2} style={[theme.font.bodySmall, { color: theme.colors.subtext, marginTop: theme.spacing(0.5) }]}>
                                            {item.last.text}
                                        </Text>
                                ) : null}
                                </View>
                                <View style={{
                                    backgroundColor: theme.colors.accent,
                                    borderRadius: theme.radii.full,
                                    padding: theme.spacing(1),
                                }}>
                                    <Ionicons name="arrow-forward" size={16} color="white" />
                                </View>
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', padding: theme.spacing(4) }}>
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
                            <Text style={[theme.font.h4, { color: theme.colors.text, marginTop: theme.spacing(2), textAlign: 'center', fontWeight: '800' }]}>
                                Nenhuma conversa ainda
                            </Text>
                            <Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', marginTop: theme.spacing(1) }]}>
                                Toque no botão + para iniciar uma nova conversa
                            </Text>
                        </View>
                    }
                />
            </Animated.View>
        </Screen>
    );
}