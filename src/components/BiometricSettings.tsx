import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import biometricAuthService from '../services/biometricAuth';

interface BiometricSettingsProps {
  onToggle?: (enabled: boolean) => void;
  showTitle?: boolean;
  compact?: boolean;
}

export default function BiometricSettings({ onToggle, showTitle = true, compact = false }: BiometricSettingsProps) {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const capabilities = await biometricAuthService.checkCapabilities();
      const isEnabled = await biometricAuthService.isBiometricEnabled();
      
      setBiometricAvailable(capabilities.isAvailable && capabilities.isEnrolled);
      setBiometricEnabled(isEnabled);
      
      if (capabilities.biometryType) {
        setBiometricType(biometricAuthService.getBiometryTypeName(capabilities.biometryType));
      }
    } catch (error) {
      console.error('Erro ao verificar status biométrico:', error);
    }
  };

  const toggleBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        'Biometria Não Disponível',
        'Seu dispositivo não possui biometria configurada ou não está disponível.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      if (biometricEnabled) {
        // Desabilitar biometria
        const success = await biometricAuthService.disableBiometric();
        if (success) {
          setBiometricEnabled(false);
          onToggle?.(false);
          Alert.alert('Biometria Desabilitada', `${biometricType} foi desabilitado com sucesso.`);
        } else {
          Alert.alert('Erro', 'Não foi possível desabilitar a biometria.');
        }
      } else {
        // Habilitar biometria - precisa de credenciais
        Alert.alert(
          'Configurar Biometria',
          `Para habilitar ${biometricType}, você precisa fazer login primeiro.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao alternar biometria:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao configurar a biometria.');
    } finally {
      setLoading(false);
    }
  };

  if (!biometricAvailable) {
    return null;
  }

  const iconName = biometricType === 'Face ID' ? 'scan' : 'finger-print';
  const iconColor = biometricEnabled ? theme.colors.success : theme.colors.subtext;

  if (compact) {
    return (
      <Pressable
        onPress={toggleBiometric}
        disabled={loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing(1.5),
          paddingHorizontal: theme.spacing(2),
          borderRadius: theme.radii.md,
          backgroundColor: biometricEnabled ? theme.colors.successSoft : theme.colors.neutralSoft,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Ionicons name={iconName} size={16} color={iconColor} />
        <Text style={{
          color: iconColor,
          ...theme.font.labelSmall,
          fontWeight: '600',
          marginLeft: theme.spacing(1),
        }}>
          {biometricEnabled ? `${biometricType} Ativo` : `${biometricType} Inativo`}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{
      backgroundColor: 'white',
			borderRadius: 20,
      padding: theme.spacing(3),
      ...theme.shadow.card,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    }}>
      {showTitle && (
        <Text style={[theme.font.h4, { color: theme.colors.text, marginBottom: theme.spacing(2) }]}>
          Autenticação Biométrica
        </Text>
      )}
      
      <Pressable
        onPress={toggleBiometric}
        disabled={loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing(2),
          opacity: loading ? 0.6 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: biometricEnabled ? theme.colors.successSoft : theme.colors.neutralSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing(2),
          }}>
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={[theme.font.label, { color: theme.colors.text, fontWeight: '700' }]}>
              {biometricType}
            </Text>
            <Text style={[theme.font.body, { color: theme.colors.subtext }]}>
              {biometricEnabled 
                ? `Use ${biometricType} para fazer login rapidamente`
                : `Configure ${biometricType} para login rápido`
              }
            </Text>
          </View>
        </View>

        <View style={{
          width: 50,
          height: 30,
          borderRadius: 15,
          backgroundColor: biometricEnabled ? theme.colors.success : theme.colors.borderLight,
          alignItems: biometricEnabled ? 'flex-end' : 'flex-start',
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}>
          <View style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: 'white',
            ...theme.shadow.button,
          }} />
        </View>
      </Pressable>

      {biometricEnabled && (
        <View style={{
          marginTop: theme.spacing(2),
          padding: theme.spacing(2),
          backgroundColor: theme.colors.successSoft,
          borderRadius: theme.radii.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={[theme.font.labelSmall, { color: theme.colors.success, marginLeft: theme.spacing(1), fontWeight: '600' }]}>
              {biometricType} está ativo e pronto para uso
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}


