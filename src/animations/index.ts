import { Animated, Easing } from 'react-native';

/**
 * Sistema de Animações Reutilizáveis - SwiftShop
 * Todas as animações padronizadas do app
 */

export class AnimationPresets {
	// Fade In
	static fadeIn(
		animatedValue: Animated.Value,
		duration: number = 300,
		delay: number = 0
	): Animated.CompositeAnimation {
		return Animated.timing(animatedValue, {
			toValue: 1,
			duration,
			delay,
			useNativeDriver: true,
			easing: Easing.out(Easing.ease),
		});
	}

	// Fade Out
	static fadeOut(
		animatedValue: Animated.Value,
		duration: number = 200,
		delay: number = 0
	): Animated.CompositeAnimation {
		return Animated.timing(animatedValue, {
			toValue: 0,
			duration,
			delay,
			useNativeDriver: true,
			easing: Easing.in(Easing.ease),
		});
	}

	// Slide In (de baixo para cima)
	static slideInUp(
		animatedValue: Animated.Value,
		distance: number = 50,
		duration: number = 400,
		delay: number = 0
	): Animated.CompositeAnimation {
		animatedValue.setValue(distance);
		return Animated.spring(animatedValue, {
			toValue: 0,
			tension: 50,
			friction: 8,
			delay,
			useNativeDriver: true,
		});
	}

	// Slide In (da direita para esquerda)
	static slideInRight(
		animatedValue: Animated.Value,
		distance: number = 50,
		duration: number = 400,
		delay: number = 0
	): Animated.CompositeAnimation {
		animatedValue.setValue(distance);
		return Animated.spring(animatedValue, {
			toValue: 0,
			tension: 50,
			friction: 8,
			delay,
			useNativeDriver: true,
		});
	}

	// Scale In
	static scaleIn(
		animatedValue: Animated.Value,
		fromScale: number = 0.8,
		duration: number = 400,
		delay: number = 0
	): Animated.CompositeAnimation {
		animatedValue.setValue(fromScale);
		return Animated.spring(animatedValue, {
			toValue: 1,
			tension: 50,
			friction: 7,
			delay,
			useNativeDriver: true,
		});
	}

	// Bounce
	static bounce(
		animatedValue: Animated.Value,
		toValue: number = 1.1,
		duration: number = 200
	): Animated.CompositeAnimation {
		return Animated.sequence([
			Animated.timing(animatedValue, {
				toValue,
				duration: duration / 2,
				useNativeDriver: true,
				easing: Easing.out(Easing.ease),
			}),
			Animated.timing(animatedValue, {
				toValue: 1,
				duration: duration / 2,
				useNativeDriver: true,
				easing: Easing.in(Easing.ease),
			}),
		]);
	}

	// Pulse (loop infinito)
	static pulse(
		animatedValue: Animated.Value,
		minScale: number = 1,
		maxScale: number = 1.05,
		duration: number = 1000
	): Animated.CompositeAnimation {
		return Animated.loop(
			Animated.sequence([
				Animated.timing(animatedValue, {
					toValue: maxScale,
					duration: duration / 2,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
				Animated.timing(animatedValue, {
					toValue: minScale,
					duration: duration / 2,
					useNativeDriver: true,
					easing: Easing.inOut(Easing.ease),
				}),
			])
		);
	}

	// Shake (tremor)
	static shake(
		animatedValue: Animated.Value,
		intensity: number = 10
	): Animated.CompositeAnimation {
		return Animated.sequence([
			Animated.timing(animatedValue, {
				toValue: intensity,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(animatedValue, {
				toValue: -intensity,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(animatedValue, {
				toValue: intensity,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(animatedValue, {
				toValue: 0,
				duration: 50,
				useNativeDriver: true,
			}),
		]);
	}

	// Rotate
	static rotate(
		animatedValue: Animated.Value,
		duration: number = 800,
		delay: number = 0
	): Animated.CompositeAnimation {
		return Animated.timing(animatedValue, {
			toValue: 1,
			duration,
			delay,
			useNativeDriver: true,
			easing: Easing.linear,
		});
	}

	// Stagger (múltiplas animações em sequência)
	static stagger(
		animations: Animated.CompositeAnimation[],
		staggerTime: number = 100
	): Animated.CompositeAnimation {
		return Animated.stagger(staggerTime, animations);
	}

	// Entrada de tela completa (fade + slide)
	static screenEnter(
		fadeValue: Animated.Value,
		slideValue: Animated.Value
	): Animated.CompositeAnimation {
		return Animated.parallel([
			this.fadeIn(fadeValue, 400),
			this.slideInUp(slideValue, 30, 400),
		]);
	}

	// Animação de card (fade + scale)
	static cardEnter(
		fadeValue: Animated.Value,
		scaleValue: Animated.Value,
		delay: number = 0
	): Animated.CompositeAnimation {
		return Animated.parallel([
			this.fadeIn(fadeValue, 300, delay),
			this.scaleIn(scaleValue, 0.9, 300, delay),
		]);
	}
}

// Hooks de animação
export const useAnimatedValue = (initialValue: number = 0): Animated.Value => {
	const ref = React.useRef(new Animated.Value(initialValue));
	return ref.current;
};

import React from 'react';

export const useScreenEnterAnimation = () => {
	const fadeAnim = useAnimatedValue(0);
	const slideAnim = useAnimatedValue(30);

	React.useEffect(() => {
		AnimationPresets.screenEnter(fadeAnim, slideAnim).start();
	}, []);

	return { fadeAnim, slideAnim };
};

export const useCardAnimation = (delay: number = 0) => {
	const fadeAnim = useAnimatedValue(0);
	const scaleAnim = useAnimatedValue(0.9);

	React.useEffect(() => {
		AnimationPresets.cardEnter(fadeAnim, scaleAnim, delay).start();
	}, [delay]);

	return { fadeAnim, scaleAnim };
};

