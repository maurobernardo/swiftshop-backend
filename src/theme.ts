export const theme = {
	colors: {
		background: '#FAF5FF',
		card: '#FFFFFF',
		primary: '#1F1B24',
		primaryAlt: '#2D2433',
		accent: '#7C3AED',
		accentSoft: '#F3E8FF',
		accentLight: '#EDE9FE',
		text: '#1F1B24',
		subtext: '#6B7280',
		subtextLight: '#9CA3AF',
		border: '#E5E7EB',
		borderLight: '#F3F4F6',
		positive: '#10B981',
		positiveSoft: '#D1FAE5',
		warning: '#F59E0B',
		warningSoft: '#FEF3C7',
		error: '#EF4444',
		errorSoft: '#FEE2E2',
		success: '#059669',
		info: '#7C3AED',
		infoSoft: '#F3E8FF',
		neutral: '#6B7280',
		neutralSoft: '#F9FAFB',
		overlay: 'rgba(0, 0, 0, 0.5)',
		overlayLight: 'rgba(0, 0, 0, 0.1)',
	},
	spacing: (n: number) => n * 8,
	radii: {
		xs: 6,
		sm: 10,
		md: 14,
		lg: 20,
		xl: 28,
		xxl: 36,
		full: 999,
	},
	shadow: {
		card: {
			shadowColor: '#000',
			shadowOpacity: 0.06,
			shadowRadius: 10,
			shadowOffset: { width: 0, height: 4 },
			elevation: 3,
		},
		cardHover: {
			shadowColor: '#000',
			shadowOpacity: 0.12,
			shadowRadius: 16,
			shadowOffset: { width: 0, height: 8 },
			elevation: 6,
		},
		button: {
			shadowColor: '#000',
			shadowOpacity: 0.08,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 2 },
			elevation: 2,
		},
		modal: {
			shadowColor: '#000',
			shadowOpacity: 0.15,
			shadowRadius: 24,
			shadowOffset: { width: 0, height: 12 },
			elevation: 8,
		},
	},
	font: {
		h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
		h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
		h3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
		h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
		label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
		labelSmall: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
		body: { fontSize: 14, lineHeight: 20 },
		bodyLarge: { fontSize: 16, lineHeight: 24 },
		bodySmall: { fontSize: 12, lineHeight: 16 },
		small: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
		caption: { fontSize: 10, color: '#9CA3AF', lineHeight: 14 },
		button: { fontSize: 16, fontWeight: '700' as const, lineHeight: 20 },
		buttonSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
	},
	animation: {
		fast: 150,
		normal: 250,
		slow: 350,
		easing: {
			ease: 'ease',
			easeIn: 'ease-in',
			easeOut: 'ease-out',
			easeInOut: 'ease-in-out',
		},
	},
	layout: {
		maxWidth: 1200,
		containerPadding: 16,
		sectionSpacing: 24,
		cardPadding: 16,
	},
};









