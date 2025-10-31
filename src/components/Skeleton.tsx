import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface Props {
    height?: number;
    width?: number | string;
    radius?: number;
    style?: ViewStyle;
    animated?: boolean;
}

export default function Skeleton({ 
    height = 16, 
    width = '100%', 
    radius = 8, 
    style, 
    animated = true 
}: Props) {
    const shimmerAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            const shimmer = Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerAnimation, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            shimmer.start();
            return () => shimmer.stop();
        }
    }, [animated, shimmerAnimation]);

    const translateX = shimmerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
    });

    return (
        <View style={[
            { 
                overflow: 'hidden', 
                borderRadius: radius, 
                backgroundColor: theme.colors.neutralSoft, 
                height, 
                width 
            }, 
            style
        ]}>
            {animated ? (
                <Animated.View
                    style={{
                        height: '100%',
                        width: '100%',
                        transform: [{ translateX }],
                    }}
                >
                    <LinearGradient
                        colors={[
                            'transparent',
                            'rgba(255, 255, 255, 0.6)',
                            'transparent'
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ height: '100%', width: '100%' }}
                    />
                </Animated.View>
            ) : (
                <LinearGradient
                    colors={[theme.colors.neutralSoft, theme.colors.borderLight, theme.colors.neutralSoft]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: '100%', width: '100%' }}
                />
            )}
        </View>
    );
}








