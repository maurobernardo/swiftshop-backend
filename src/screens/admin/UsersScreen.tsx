import React, { useEffect, useState, useRef } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View, Animated, ScrollView, Image } from 'react-native';
import { createAdminUser, deleteUser, listUsers } from '../../api/users';
import { User } from '../../types';
import { theme } from '../../theme';
import AnimatedButton from '../../components/AnimatedButton';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFullImageUrl } from '../../utils/imageUtils';

export default function UsersScreen() {
	const [items, setItems] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [modal, setModal] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
    const [selected, setSelected] = useState<User | null>(null);
    const [query, setQuery] = useState('');
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

	const refresh = async () => {
		setLoading(true);
		try {
			setItems(await listUsers());
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

	const save = async () => {
		try {
			await createAdminUser(name, email, password);
			setModal(false);
			setName(''); setEmail(''); setPassword('');
			await refresh();
			Alert.alert('Sucesso', 'Administrador criado');
		} catch (e: any) {
			Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao criar admin');
		}
	};

	const inputStyle = { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 12, color: theme.colors.primary } as const;

    return (
        <Animated.View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
        }}>
            <Screen title="Usuários" right={
                <Pressable 
                    onPress={() => setModal(true)}
                    style={{
                        backgroundColor: theme.colors.accent,
                        borderRadius: theme.radii.full,
                        paddingHorizontal: theme.spacing(3),
                        paddingVertical: theme.spacing(1.5),
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing(1),
                        ...theme.shadow.button,
                    }}
                >
                    <Ionicons name="add" size={16} color="white" />
                    <Text style={[theme.font.label, { color: 'white', fontWeight: '700' }]}>
                        Novo
                    </Text>
                </Pressable>
            }>
                <View style={{ gap: theme.spacing(3) }}>
                    {/* Search Bar */}
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: theme.radii.lg,
                        borderWidth: 1,
                        borderColor: theme.colors.borderLight,
                        padding: theme.spacing(2),
                        ...theme.shadow.button,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) }}>
                            <Ionicons name="search" size={20} color={theme.colors.subtext} />
                            <TextInput 
                                placeholder="Buscar por nome ou email" 
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
                    </View>

                    {/* Users List */}
                    <FlatList
                        contentContainerStyle={{ paddingTop: 0, gap: theme.spacing(2) }}
                        data={items.filter(u => (u.name + ' ' + u.email).toLowerCase().includes(query.toLowerCase()))}
                        keyExtractor={(u) => String(u.id)}
                        renderItem={({ item }) => (
                            <Animated.View style={{
                                backgroundColor: 'white',
                                borderRadius: theme.radii.lg,
                                borderWidth: 1,
                                borderColor: theme.colors.borderLight,
                                padding: theme.spacing(3),
                                ...theme.shadow.card,
                            }}>
                                <Pressable onPress={() => setSelected(item)}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(1) }}>
                                                <View style={{
                                                    backgroundColor: theme.colors.accentSoft,
                                                    borderRadius: theme.radii.full,
                                                    padding: theme.spacing(1),
                                                    ...theme.shadow.button,
                                                }}>
                                                    <Ionicons name="person" size={16} color={theme.colors.accent} />
                                                </View>
                                                <Text style={[theme.font.h4, { fontWeight: '800', color: theme.colors.text }]}>
                                                    {item.name}
                                                </Text>
                                            </View>
                                            <Text style={[theme.font.body, { color: theme.colors.subtext, marginBottom: theme.spacing(0.5) }]}>
                                                {item.email}
                                            </Text>
                                            <View style={{
                                                backgroundColor: item.role === 'admin' ? theme.colors.accentSoft : theme.colors.neutralSoft,
                                                paddingHorizontal: theme.spacing(2),
                                                paddingVertical: theme.spacing(0.5),
                                                borderRadius: theme.radii.full,
                                                alignSelf: 'flex-start',
                                            }}>
                                                <Text style={[theme.font.labelSmall, { 
                                                    color: item.role === 'admin' ? theme.colors.accent : theme.colors.subtext,
                                                    fontWeight: '700'
                                                }]}>
                                                    {item.role === 'admin' ? 'Administrador' : 'Cliente'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Pressable 
                                            onPress={() => {
                                                Alert.alert('Confirmar', 'Excluir usuário?', [
                                                    { text: 'Cancelar' },
                                                    { text: 'Excluir', onPress: async () => { await deleteUser(item.id); await refresh(); } }
                                                ]);
                                            }}
                                            style={{
                                                backgroundColor: theme.colors.errorSoft,
                                                borderRadius: theme.radii.full,
                                                padding: theme.spacing(2),
                                                ...theme.shadow.button,
                                            }}
                                        >
                                            <Ionicons name="trash" size={16} color={theme.colors.error} />
                                        </Pressable>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', padding: theme.spacing(4) }}>
                                <Ionicons name="people-outline" size={48} color={theme.colors.subtext} />
                                <Text style={[theme.font.h4, { color: theme.colors.text, marginTop: theme.spacing(2), textAlign: 'center' }]}>
                                    Nenhum usuário encontrado
                                </Text>
                                <Text style={[theme.font.body, { color: theme.colors.subtext, textAlign: 'center', marginTop: theme.spacing(1) }]}>
                                    {query ? 'Tente ajustar sua busca' : 'Adicione o primeiro usuário'}
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
                                <Ionicons name="person" size={20} color="white" />
                            </View>
                            <Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '800' }]}>
                                Detalhes do Usuário
                            </Text>
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
                            {/* Profile Card */}
                            <View style={{
                                backgroundColor: 'white',
                                borderRadius: 24,
                                padding: theme.spacing(4),
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: theme.colors.borderLight,
                                ...theme.shadow.card,
                            }}>
								{/* Avatar */}
								<View style={{
									width: 120,
									height: 120,
									borderRadius: 60,
									backgroundColor: selected?.avatar_url ? theme.colors.neutralSoft : theme.colors.accentSoft,
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: theme.spacing(3),
									overflow: 'hidden',
									borderWidth: 4,
									borderColor: theme.colors.accent,
									...theme.shadow.card,
								}}>
									{selected?.avatar_url ? (
										<Image 
											source={{ uri: getFullImageUrl(selected.avatar_url) }} 
											style={{ width: '100%', height: '100%' }}
											resizeMode="cover"
										/>
									) : (
										<Ionicons name="person" size={48} color={theme.colors.accent} />
									)}
								</View>

                                {/* Name and Role */}
                                <Text style={[theme.font.h2, { color: theme.colors.text, fontWeight: '800', textAlign: 'center' }]}>
                                    {selected?.name}
                                </Text>
                                <View style={{
                                    backgroundColor: selected?.role === 'admin' ? theme.colors.accentSoft : theme.colors.neutralSoft,
                                    paddingHorizontal: theme.spacing(3),
                                    paddingVertical: theme.spacing(1),
                                    borderRadius: theme.radii.full,
                                    marginTop: theme.spacing(1),
                                }}>
                                    <Text style={[theme.font.label, { 
                                        color: selected?.role === 'admin' ? theme.colors.accent : theme.colors.subtext,
                                        fontWeight: '700'
                                    }]}>
                                        {selected?.role === 'admin' ? 'Administrador' : 'Cliente'}
                                    </Text>
                                </View>
                            </View>

                            {/* Contact Information */}
                            <View style={{
                                backgroundColor: 'white',
                                borderRadius: 24,
                                padding: theme.spacing(4),
                                borderWidth: 1,
                                borderColor: theme.colors.borderLight,
                                ...theme.shadow.card,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(3) }}>
                                    <View style={{
                                        backgroundColor: theme.colors.positiveSoft,
                                        borderRadius: theme.radii.full,
                                        padding: theme.spacing(1.5),
                                        ...theme.shadow.button,
                                    }}>
                                        <Ionicons name="mail" size={20} color={theme.colors.success} />
                                    </View>
                                    <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                                        Informações de Contato
                                    </Text>
                                </View>

                                <View style={{ gap: theme.spacing(2) }}>
                                    {/* Email */}
                                    <View style={{
                                        backgroundColor: theme.colors.neutralSoft,
                                        borderRadius: theme.radii.lg,
                                        padding: theme.spacing(2.5),
                                        borderLeftWidth: 4,
                                        borderLeftColor: theme.colors.accent,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), marginBottom: theme.spacing(0.5) }}>
                                            <Ionicons name="mail-outline" size={16} color={theme.colors.accent} />
                                            <Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                Email
                                            </Text>
                                        </View>
                                        <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '600', marginLeft: theme.spacing(3) }]}>
                                            {selected?.email || '-'}
                                        </Text>
                                    </View>

                                    {/* Phone */}
                                    <View style={{
                                        backgroundColor: theme.colors.neutralSoft,
                                        borderRadius: theme.radii.lg,
                                        padding: theme.spacing(2.5),
                                        borderLeftWidth: 4,
                                        borderLeftColor: theme.colors.success,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), marginBottom: theme.spacing(0.5) }}>
                                            <Ionicons name="call-outline" size={16} color={theme.colors.success} />
                                            <Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                Telefone
                                            </Text>
                                        </View>
                                        <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '600', marginLeft: theme.spacing(3) }]}>
                                            {selected?.phone || 'Não informado'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Address Information */}
                            {(selected?.street || selected?.city || selected?.state || selected?.country) && (
                                <View style={{
                                    backgroundColor: 'white',
                                    borderRadius: 24,
                                    padding: theme.spacing(4),
                                    borderWidth: 1,
                                    borderColor: theme.colors.borderLight,
                                    ...theme.shadow.card,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), marginBottom: theme.spacing(3) }}>
                                        <View style={{
                                            backgroundColor: theme.colors.warningSoft,
                                            borderRadius: theme.radii.full,
                                            padding: theme.spacing(1.5),
                                            ...theme.shadow.button,
                                        }}>
                                            <Ionicons name="location" size={20} color={theme.colors.warning} />
                                        </View>
                                        <Text style={[theme.font.h4, { color: theme.colors.text, fontWeight: '800' }]}>
                                            Endereço
                                        </Text>
                                    </View>

                                    <View style={{
                                        backgroundColor: theme.colors.neutralSoft,
                                        borderRadius: theme.radii.lg,
                                        padding: theme.spacing(3),
                                        borderLeftWidth: 4,
                                        borderLeftColor: theme.colors.warning,
                                    }}>
                                        <View style={{ gap: theme.spacing(1.5) }}>
                                            {selected?.street && (
                                                <View style={{ flexDirection: 'row', gap: theme.spacing(1) }}>
                                                    <Text style={[theme.font.body, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                        Rua:
                                                    </Text>
                                                    <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '500', flex: 1 }]}>
                                                        {selected.street}{selected.number ? `, ${selected.number}` : ''}
                                                    </Text>
                                                </View>
                                            )}
                                            {selected?.city && (
                                                <View style={{ flexDirection: 'row', gap: theme.spacing(1) }}>
                                                    <Text style={[theme.font.body, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                        Cidade:
                                                    </Text>
                                                    <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '500', flex: 1 }]}>
                                                        {selected.city}
                                                    </Text>
                                                </View>
                                            )}
                                            {selected?.state && (
                                                <View style={{ flexDirection: 'row', gap: theme.spacing(1) }}>
                                                    <Text style={[theme.font.body, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                        Estado:
                                                    </Text>
                                                    <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '500', flex: 1 }]}>
                                                        {selected.state}
                                                    </Text>
                                                </View>
                                            )}
                                            {selected?.country && (
                                                <View style={{ flexDirection: 'row', gap: theme.spacing(1) }}>
                                                    <Text style={[theme.font.body, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                        País:
                                                    </Text>
                                                    <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '500', flex: 1 }]}>
                                                        {selected.country}
                                                    </Text>
                                                </View>
                                            )}
                                            {selected?.reference && (
                                                <View style={{ flexDirection: 'row', gap: theme.spacing(1) }}>
                                                    <Text style={[theme.font.body, { color: theme.colors.subtext, fontWeight: '600' }]}>
                                                        Referência:
                                                    </Text>
                                                    <Text style={[theme.font.body, { color: theme.colors.text, fontWeight: '500', flex: 1 }]}>
                                                        {selected.reference}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Action Button */}
                            <View style={{ marginTop: theme.spacing(2) }}>
                                <AnimatedButton 
                                    title="Fechar" 
                                    onPress={() => setSelected(null)} 
                                    variant="secondary" 
                                    fullWidth 
                                    icon="close-circle"
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
            
            <Modal visible={modal} animationType="slide">
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
                                <Ionicons name="person-add" size={20} color="white" />
                            </View>
                            <Text style={[theme.font.h3, { color: theme.colors.text, fontWeight: '800' }]}>
                                Criar Administrador
                            </Text>
                        </View>
                        <Pressable 
                            onPress={() => setModal(false)}
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
                            {/* Form Fields */}
                            <View style={{
                                backgroundColor: 'white',
                                borderRadius: theme.radii.lg,
                                padding: theme.spacing(3),
                                ...theme.shadow.card,
                            }}>
                                <Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
                                    Informações do Administrador
                                </Text>
                                
                                <View style={{ gap: theme.spacing(3) }}>
                                    <View>
                                        <Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
                                            Nome Completo
                                        </Text>
                                        <TextInput 
                                            placeholder="Digite o nome completo" 
                                            value={name} 
                                            onChangeText={setName} 
                                            style={{
                                                backgroundColor: theme.colors.neutralSoft,
                                                borderWidth: 1,
                                                borderColor: theme.colors.borderLight,
                                                borderRadius: theme.radii.lg,
                                                padding: theme.spacing(3),
                                                ...theme.font.body,
                                                color: theme.colors.text,
                                            }} 
                                            placeholderTextColor={theme.colors.subtext} 
                                        />
                                    </View>

                                    <View>
                                        <Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
                                            Email
                                        </Text>
                                        <TextInput 
                                            placeholder="Digite o email" 
                                            value={email} 
                                            onChangeText={setEmail} 
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            style={{
                                                backgroundColor: theme.colors.neutralSoft,
                                                borderWidth: 1,
                                                borderColor: theme.colors.borderLight,
                                                borderRadius: theme.radii.lg,
                                                padding: theme.spacing(3),
                                                ...theme.font.body,
                                                color: theme.colors.text,
                                            }} 
                                            placeholderTextColor={theme.colors.subtext} 
                                        />
                                    </View>

                                    <View>
                                        <Text style={[theme.font.label, { color: theme.colors.text, marginBottom: theme.spacing(1) }]}>
                                            Senha
                                        </Text>
                                        <TextInput 
                                            placeholder="Digite a senha" 
                                            value={password} 
                                            onChangeText={setPassword} 
                                            secureTextEntry
                                            style={{
                                                backgroundColor: theme.colors.neutralSoft,
                                                borderWidth: 1,
                                                borderColor: theme.colors.borderLight,
                                                borderRadius: theme.radii.lg,
                                                padding: theme.spacing(3),
                                                ...theme.font.body,
                                                color: theme.colors.text,
                                            }} 
                                            placeholderTextColor={theme.colors.subtext} 
                                        />
                                    </View>
                                </View>
                            </View>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: theme.spacing(2) }}>
                            <View style={{ flex: 1 }}>
                                <AnimatedButton title="Criar Administrador" onPress={save} fullWidth />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Pressable
                                        onPress={() => setModal(false)}
                                        style={{
                                            backgroundColor: theme.colors.neutralSoft,
                                            borderRadius: theme.radii.lg,
                                            padding: theme.spacing(3),
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: theme.colors.borderLight,
                                            ...theme.shadow.button,
                                        }}
                                    >
                                        <Text style={[theme.font.label, { color: theme.colors.subtext, fontWeight: '700' }]}>
                                            Cancelar
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </Animated.View>
    );
}
