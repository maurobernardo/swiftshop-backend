import React from 'react';
import { View, Text, ViewStyle, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface Props {
    title?: string;
    right?: React.ReactNode;
    style?: ViewStyle;
    children: React.ReactNode;
    showBackButton?: boolean;
}

export default function Screen({ title, right, style, children, showBackButton = false }: Props) {
    const navigation = useNavigation();
    
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {title != null ? (
                <View style={{ paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(4), paddingBottom: theme.spacing(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {showBackButton && (
                            <Pressable 
                                onPress={() => navigation.goBack()} 
                                style={{ 
                                    marginRight: theme.spacing(2),
                                    padding: theme.spacing(1),
                                }}
                            >
                                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                            </Pressable>
                        )}
                        <Text style={{ ...theme.font.h2, flex: 1 }}>{title}</Text>
                    </View>
                    <View>{right}</View>
                </View>
            ) : null}
            <View style={{ flex: 1, paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(2), ...(style || {}) }}>
                {children}
            </View>
        </View>
    );
}







