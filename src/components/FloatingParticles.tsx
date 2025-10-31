import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
	id: number;
	x: Animated.Value;
	y: Animated.Value;
	opacity: Animated.Value;
	scale: Animated.Value;
	size: number;
	duration: number;
}

interface FloatingParticlesProps {
	count?: number;
	colors?: string[];
}

export default function FloatingParticles({ 
	count = 20, 
	colors = ['#fff', '#F3E8FF', '#FEF3C7', '#FEE2E2'] 
}: FloatingParticlesProps) {
	const particlesRef = useRef<Particle[]>([]);

	useEffect(() => {
		// Criar partículas
		const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
			id: i,
			x: new Animated.Value(Math.random() * width),
			y: new Animated.Value(Math.random() * height),
			opacity: new Animated.Value(Math.random() * 0.5 + 0.2),
			scale: new Animated.Value(Math.random() * 0.5 + 0.5),
			size: Math.random() * 40 + 20,
			duration: Math.random() * 10000 + 10000,
		}));

		particlesRef.current = particles;

		// Animar cada partícula
		particles.forEach((particle) => {
			animateParticle(particle);
		});

		return () => {
			particles.forEach((particle) => {
				particle.x.stopAnimation();
				particle.y.stopAnimation();
				particle.opacity.stopAnimation();
				particle.scale.stopAnimation();
			});
		};
	}, [count]);

	const animateParticle = (particle: Particle) => {
		const randomX = Math.random() * width;
		const randomY = Math.random() * height;
		const randomOpacity = Math.random() * 0.5 + 0.2;
		const randomScale = Math.random() * 0.5 + 0.5;

		Animated.parallel([
			Animated.timing(particle.x, {
				toValue: randomX,
				duration: particle.duration,
				useNativeDriver: true,
			}),
			Animated.timing(particle.y, {
				toValue: randomY,
				duration: particle.duration,
				useNativeDriver: true,
			}),
			Animated.sequence([
				Animated.timing(particle.opacity, {
					toValue: randomOpacity,
					duration: particle.duration / 2,
					useNativeDriver: true,
				}),
				Animated.timing(particle.opacity, {
					toValue: Math.random() * 0.3 + 0.1,
					duration: particle.duration / 2,
					useNativeDriver: true,
				}),
			]),
			Animated.sequence([
				Animated.timing(particle.scale, {
					toValue: randomScale,
					duration: particle.duration / 2,
					useNativeDriver: true,
				}),
				Animated.timing(particle.scale, {
					toValue: Math.random() * 0.5 + 0.5,
					duration: particle.duration / 2,
					useNativeDriver: true,
				}),
			]),
		]).start(() => {
			// Reiniciar animação
			animateParticle(particle);
		});
	};

	return (
		<View style={styles.container} pointerEvents="none">
			{particlesRef.current.map((particle, index) => (
				<Animated.View
					key={particle.id}
					style={[
						styles.particle,
						{
							width: particle.size,
							height: particle.size,
							borderRadius: particle.size / 2,
							backgroundColor: colors[index % colors.length],
							opacity: particle.opacity,
							transform: [
								{ translateX: particle.x },
								{ translateY: particle.y },
								{ scale: particle.scale },
							],
						},
					]}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		overflow: 'hidden',
	},
	particle: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
});

