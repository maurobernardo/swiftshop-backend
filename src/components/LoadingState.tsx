import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '../theme';
import Skeleton from './Skeleton';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    type?: 'product' | 'list' | 'card' | 'profile';
    count?: number;
}

export default function LoadingState({ type = 'list', count = 3 }: Props) {
    const renderProductSkeleton = () => (
        <View style={{ width: '48%', marginBottom: theme.spacing(2) }}>
            <Skeleton height={120} radius={theme.radii.md} style={{ marginBottom: theme.spacing(1) }} />
            <Skeleton height={16} width="80%" radius={theme.radii.xs} style={{ marginBottom: theme.spacing(0.5) }} />
            <Skeleton height={14} width="60%" radius={theme.radii.xs} />
        </View>
    );

    const renderListSkeleton = () => (
        <View style={{ gap: theme.spacing(2) }}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={{
                    backgroundColor: 'white',
		borderRadius: 20,
                    padding: theme.spacing(2),
                    ...theme.shadow.card,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) }}>
                        <Skeleton height={40} width={40} radius={theme.radii.full} style={{ marginRight: theme.spacing(1.5) }} />
                        <View style={{ flex: 1 }}>
                            <Skeleton height={16} width="70%" radius={theme.radii.xs} style={{ marginBottom: theme.spacing(0.5) }} />
                            <Skeleton height={12} width="50%" radius={theme.radii.xs} />
                        </View>
                    </View>
                    <Skeleton height={14} width="100%" radius={theme.radii.xs} style={{ marginBottom: theme.spacing(0.5) }} />
                    <Skeleton height={14} width="80%" radius={theme.radii.xs} />
                </View>
            ))}
        </View>
    );

    const renderCardSkeleton = () => (
        <View style={{ gap: theme.spacing(2) }}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={{
                    backgroundColor: 'white',
		borderRadius: 20,
                    padding: theme.spacing(3),
                    ...theme.shadow.card,
                }}>
                    <Skeleton height={20} width="60%" radius={theme.radii.xs} style={{ marginBottom: theme.spacing(2) }} />
                    <View style={{ gap: theme.spacing(1) }}>
                        <Skeleton height={14} width="100%" radius={theme.radii.xs} />
                        <Skeleton height={14} width="90%" radius={theme.radii.xs} />
                        <Skeleton height={14} width="75%" radius={theme.radii.xs} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderProfileSkeleton = () => (
        <View style={{ gap: theme.spacing(3) }}>
            {/* Profile Header */}
            <View style={{
                backgroundColor: 'white',
		borderRadius: 20,
                padding: theme.spacing(4),
                alignItems: 'center',
                ...theme.shadow.card,
            }}>
                <Skeleton height={120} width={120} radius={theme.radii.full} style={{ marginBottom: theme.spacing(2) }} />
                <Skeleton height={24} width="60%" radius={theme.radii.xs} style={{ marginBottom: theme.spacing(1) }} />
                <Skeleton height={16} width="40%" radius={theme.radii.xs} />
            </View>

            {/* Profile Cards */}
            {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={{
                    backgroundColor: 'white',
		borderRadius: 20,
                    padding: theme.spacing(3),
                    ...theme.shadow.card,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(2) }}>
                        <Skeleton height={40} width={40} radius={theme.radii.sm} style={{ marginRight: theme.spacing(1.5) }} />
                        <Skeleton height={18} width="50%" radius={theme.radii.xs} />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
                        {Array.from({ length: 4 }).map((_, cardIndex) => (
                            <View key={cardIndex} style={{ width: '48%' }}>
                                <Skeleton height={60} width="100%" radius={theme.radii.md} />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );

    const renderContent = () => {
        switch (type) {
            case 'product':
                return (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {Array.from({ length: count }).map((_, index) => (
                            <View key={index}>
                                {renderProductSkeleton()}
                            </View>
                        ))}
                    </View>
                );
            case 'list':
                return renderListSkeleton();
            case 'card':
                return renderCardSkeleton();
            case 'profile':
                return renderProfileSkeleton();
            default:
                return renderListSkeleton();
        }
    };

    return (
        <View style={{ padding: theme.spacing(2) }}>
            {renderContent()}
        </View>
    );
}






