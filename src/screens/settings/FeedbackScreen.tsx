import React, { useState } from 'react';
import { 
	View, 
	Text, 
	ScrollView, 
	Pressable, 
	Alert,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Rating
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Screen from '../../components/Screen';
import AnimatedButton from '../../components/AnimatedButton';

interface FeedbackCategory {
	id: string;
	name: string;
	icon: string;
	description: string;
}

export default function FeedbackScreen() {
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [rating, setRating] = useState<number>(0);
	const [feedback, setFeedback] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [loading, setLoading] = useState(false);

	const categories: FeedbackCategory[] = [
		{
			id: 'bug',
			name: 'Bug/Erro',
			icon: 'bug-outline',
			description: 'Reportar problemas técnicos ou erros no app'
		},
		{
			id: 'feature',
			name: 'Sugestão',
			icon: 'bulb-outline',
			description: 'Sugerir novas funcionalidades'
		},
		{
			id: 'ui',
			name: 'Interface',
			icon: 'color-palette-outline',
			description: 'Feedback sobre design e usabilidade'
		},
		{
			id: 'performance',
			name: 'Performance',
			icon: 'speedometer-outline',
			description: 'Problemas de velocidade ou lentidão'
		},
		{
			id: 'content',
			name: 'Conteúdo',
			icon: 'document-text-outline',
			description: 'Erros em produtos ou informações'
		},
		{
			id: 'other',
			name: 'Outro',
			icon: 'ellipsis-horizontal-outline',
			description: 'Outros tipos de feedback'
		},
	];

	const handleSubmit = async () => {
		if (!selectedCategory) {
			Alert.alert('Categoria obrigatória', 'Selecione uma categoria para seu feedback.');
			return;
		}

		if (!feedback.trim()) {
			Alert.alert('Feedback obrigatório', 'Descreva seu feedback ou sugestão.');
			return;
		}

		if (feedback.trim().length < 10) {
			Alert.alert('Feedback muito curto', 'Por favor, forneça mais detalhes (mínimo 10 caracteres).');
			return;
		}

		setLoading(true);
		
		// Simular envio do feedback
		setTimeout(() => {
			setLoading(false);
			Alert.alert(
				'Feedback Enviado!',
				'Obrigado pelo seu feedback. Nossa equipe analisará sua mensagem e entrará em contato se necessário.',
				[
					{
						text: 'OK',
						onPress: () => {
							// Limpar formulário
							setSelectedCategory('');
							setRating(0);
							setFeedback('');
							setContactEmail('');
						}
					}
				]
			);
		}, 2000);
	};

	const getCategoryIcon = (categoryId: string) => {
		const category = categories.find(c => c.id === categoryId);
		return category?.icon || 'help-circle-outline';
	};

	const getCategoryColor = (categoryId: string) => {
		const colors: Record<string, string> = {
			bug: theme.colors.error,
			feature: theme.colors.success,
			ui: theme.colors.accent,
			performance: theme.colors.warning || '#F59E0B',
			content: theme.colors.info || '#3B82F6',
			other: theme.colors.subtext,
		};
		return colors[categoryId] || theme.colors.accent;
	};

	const renderStars = () => {
		return (
			<View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: theme.spacing(2) }}>
				{[1, 2, 3, 4, 5].map((star) => (
					<Pressable
						key={star}
						onPress={() => setRating(star)}
						style={{ marginHorizontal: 4 }}
					>
						<Ionicons
							name={star <= rating ? 'star' : 'star-outline'}
							size={32}
							color={star <= rating ? '#F59E0B' : theme.colors.borderLight}
						/>
					</Pressable>
				))}
			</View>
		);
	};

	return (
		<Screen title="Enviar Feedback" showBackButton>
			<KeyboardAvoidingView 
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView showsVerticalScrollIndicator={false}>
					{/* Rating Section */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: theme.radii.xl,
						padding: theme.spacing(4),
						marginBottom: theme.spacing(4),
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						<Text style={{
							...theme.font.h3,
							color: theme.colors.text,
							textAlign: 'center',
							marginBottom: theme.spacing(2),
							fontWeight: '700',
						}}>
							Avalie sua Experiência
						</Text>
						{renderStars()}
						{rating > 0 && (
							<Text style={{
								...theme.font.body,
								color: theme.colors.subtext,
								textAlign: 'center',
								marginTop: theme.spacing(1),
							}}>
								{rating === 1 && 'Muito ruim'}
								{rating === 2 && 'Ruim'}
								{rating === 3 && 'Regular'}
								{rating === 4 && 'Bom'}
								{rating === 5 && 'Excelente'}
							</Text>
						)}
					</View>

					{/* Category Selection */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: theme.radii.xl,
						padding: theme.spacing(4),
						marginBottom: theme.spacing(4),
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						<Text style={{
							...theme.font.h3,
							color: theme.colors.text,
							marginBottom: theme.spacing(3),
							fontWeight: '700',
						}}>
							Categoria do Feedback
						</Text>

						<View style={{ gap: theme.spacing(2) }}>
							{categories.map((category) => (
								<Pressable
									key={category.id}
									onPress={() => setSelectedCategory(category.id)}
									style={{
										borderRadius: 20,
										padding: theme.spacing(3),
										borderWidth: 2,
										borderColor: selectedCategory === category.id ? getCategoryColor(category.id) : theme.colors.borderLight,
										backgroundColor: selectedCategory === category.id ? `${getCategoryColor(category.id)}10` : 'white',
										...theme.shadow.button,
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<View style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											backgroundColor: selectedCategory === category.id ? getCategoryColor(category.id) : theme.colors.accentSoft,
											alignItems: 'center',
											justifyContent: 'center',
											marginRight: theme.spacing(3),
										}}>
											<Ionicons 
												name={category.icon as any} 
												size={20} 
												color={selectedCategory === category.id ? 'white' : theme.colors.accent} 
											/>
										</View>
										<View style={{ flex: 1 }}>
											<Text style={{
												...theme.font.label,
												color: theme.colors.text,
												fontWeight: '700',
												marginBottom: 2,
											}}>
												{category.name}
											</Text>
											<Text style={{
												...theme.font.body,
												color: theme.colors.subtext,
												fontSize: 12,
											}}>
												{category.description}
											</Text>
										</View>
										{selectedCategory === category.id && (
											<Ionicons name="checkmark-circle" size={20} color={getCategoryColor(category.id)} />
										)}
									</View>
								</Pressable>
							))}
						</View>
					</View>

					{/* Feedback Form */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: theme.radii.xl,
						padding: theme.spacing(4),
						marginBottom: theme.spacing(4),
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						<Text style={{
							...theme.font.h3,
							color: theme.colors.text,
							marginBottom: theme.spacing(3),
							fontWeight: '700',
						}}>
							Descreva seu Feedback
						</Text>

						<TextInput
							value={feedback}
							onChangeText={setFeedback}
							placeholder="Descreva detalhadamente seu feedback, sugestão ou problema encontrado..."
							multiline
							numberOfLines={6}
							style={{
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
								borderRadius: 20,
								padding: theme.spacing(3),
								backgroundColor: theme.colors.neutralSoft,
								color: theme.colors.text,
								fontSize: 16,
								textAlignVertical: 'top',
								minHeight: 120,
							}}
							placeholderTextColor={theme.colors.subtext}
							selectionColor={theme.colors.accent}
						/>
						
						<Text style={{
							...theme.font.labelSmall,
							color: theme.colors.subtext,
							textAlign: 'right',
							marginTop: theme.spacing(1),
						}}>
							{feedback.length}/500 caracteres
						</Text>
					</View>

					{/* Contact Information */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: theme.radii.xl,
						padding: theme.spacing(4),
						marginBottom: theme.spacing(4),
						...theme.shadow.card,
						borderWidth: 1,
						borderColor: theme.colors.borderLight,
					}}>
						<Text style={{
							...theme.font.h3,
							color: theme.colors.text,
							marginBottom: theme.spacing(3),
							fontWeight: '700',
						}}>
							Informações de Contato (Opcional)
						</Text>

						<Text style={{
							...theme.font.body,
							color: theme.colors.subtext,
							marginBottom: theme.spacing(2),
						}}>
							Forneça seu email se deseja receber uma resposta sobre seu feedback.
						</Text>

						<TextInput
							value={contactEmail}
							onChangeText={setContactEmail}
							placeholder="seu@email.com"
							keyboardType="email-address"
							autoCapitalize="none"
							style={{
								borderWidth: 1,
								borderColor: theme.colors.borderLight,
								borderRadius: 20,
								padding: theme.spacing(3),
								backgroundColor: theme.colors.neutralSoft,
								color: theme.colors.text,
								fontSize: 16,
							}}
							placeholderTextColor={theme.colors.subtext}
							selectionColor={theme.colors.accent}
						/>
					</View>

					{/* Submit Button */}
					<Button
						title={loading ? 'Enviando...' : 'Enviar Feedback'}
						onPress={handleSubmit}
						disabled={loading || !selectedCategory || !feedback.trim()}
						style={{
							...theme.shadow.button,
							paddingVertical: theme.spacing(3),
							marginBottom: theme.spacing(4),
							opacity: loading || !selectedCategory || !feedback.trim() ? 0.6 : 1,
						}}
					/>

					{/* Help Text */}
					<View style={{
						backgroundColor: theme.colors.accentSoft,
						borderRadius: 20,
						padding: theme.spacing(3),
						marginBottom: theme.spacing(4),
					}}>
						<View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
							<Ionicons name="information-circle" size={20} color={theme.colors.accent} style={{ marginRight: theme.spacing(2), marginTop: 2 }} />
							<View style={{ flex: 1 }}>
								<Text style={{
									...theme.font.label,
									color: theme.colors.accent,
									fontWeight: '700',
									marginBottom: theme.spacing(1),
								}}>
									Dicas para um bom feedback:
								</Text>
								<Text style={{
									...theme.font.body,
									color: theme.colors.accent,
									fontSize: 13,
									lineHeight: 18,
								}}>
									• Seja específico e detalhado{'\n'}
									• Inclua passos para reproduzir problemas{'\n'}
									• Mencione seu dispositivo e versão do app{'\n'}
									• Use linguagem respeitosa e construtiva
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Screen>
	);
}


