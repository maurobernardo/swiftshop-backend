import React, { useState } from 'react';
import SplashScreen from './SplashScreen';
import WelcomeScreen from './WelcomeScreen';

interface InitialLoadingScreenProps {
	navigation: any;
}

export default function InitialLoadingScreen({ navigation }: InitialLoadingScreenProps) {
	const [showSplash, setShowSplash] = useState(true);

	const handleSplashFinish = () => {
		setShowSplash(false);
	};

	if (showSplash) {
		return <SplashScreen onFinish={handleSplashFinish} />;
	}

	return <WelcomeScreen navigation={navigation} />;
}

