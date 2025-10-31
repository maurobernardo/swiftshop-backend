import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: LocalAuthentication.AuthenticationType;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: LocalAuthentication.AuthenticationType | null;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

class BiometricAuthService {
  private readonly STORAGE_KEY = 'biometric_enabled';
  private readonly USER_CREDENTIALS_KEY = 'user_credentials';

  /**
   * Verifica se a autenticação biométrica está disponível no dispositivo
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        isAvailable,
        biometryType: supportedTypes.length > 0 ? supportedTypes[0] : null,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Erro ao verificar capacidades biométricas:', error);
      return {
        isAvailable: false,
        biometryType: null,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Obtém o tipo de biometria disponível como string amigável
   */
  getBiometryTypeName(biometryType: LocalAuthentication.AuthenticationType): string {
    switch (biometryType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face ID';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Impressão Digital';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      default:
        return 'Biometria';
    }
  }

  /**
   * Verifica se a autenticação biométrica está habilitada pelo usuário
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.STORAGE_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Erro ao verificar status biométrico:', error);
      return false;
    }
  }

  /**
   * Habilita a autenticação biométrica para o usuário
   */
  async enableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Erro ao habilitar biometria:', error);
      return false;
    }
  }

  /**
   * Desabilita a autenticação biométrica
   */
  async disableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, 'false');
      // Remove credenciais salvas
      await AsyncStorage.removeItem(this.USER_CREDENTIALS_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao desabilitar biometria:', error);
      return false;
    }
  }

  /**
   * Salva credenciais do usuário para autenticação biométrica
   */
  async saveUserCredentials(email: string, password: string): Promise<boolean> {
    try {
      const credentials = JSON.stringify({ email, password });
      await AsyncStorage.setItem(this.USER_CREDENTIALS_KEY, credentials);
      return true;
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      return false;
    }
  }

  /**
   * Recupera credenciais salvas do usuário
   */
  async getUserCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentials = await AsyncStorage.getItem(this.USER_CREDENTIALS_KEY);
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Erro ao recuperar credenciais:', error);
      return null;
    }
  }

  /**
   * Remove credenciais salvas
   */
  async clearUserCredentials(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.USER_CREDENTIALS_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar credenciais:', error);
      return false;
    }
  }

  /**
   * Executa autenticação biométrica
   */
  async authenticate(reason: string = 'Autentique-se para continuar'): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.checkCapabilities();
      
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Autenticação biométrica não está disponível neste dispositivo',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: 'Nenhuma biometria cadastrada. Configure Face ID ou Impressão Digital nas configurações do dispositivo.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        return {
          success: true,
          biometryType: capabilities.biometryType || undefined,
        };
      } else {
        let errorMessage = 'Autenticação cancelada';
        
        if (result.error === 'user_cancel') {
          errorMessage = 'Autenticação cancelada pelo usuário';
        } else if (result.error === 'system_cancel') {
          errorMessage = 'Autenticação cancelada pelo sistema';
        } else if (result.error === 'user_fallback') {
          errorMessage = 'Usuário escolheu usar senha';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      return {
        success: false,
        error: 'Erro interno na autenticação biométrica',
      };
    }
  }

  /**
   * Executa login com autenticação biométrica
   */
  async loginWithBiometric(): Promise<{ success: boolean; email?: string; password?: string; error?: string }> {
    try {
      // Verifica se biometria está habilitada
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Autenticação biométrica não está habilitada',
        };
      }

      // Recupera credenciais salvas
      const credentials = await this.getUserCredentials();
      if (!credentials) {
        return {
          success: false,
          error: 'Nenhuma credencial salva encontrada',
        };
      }

      // Executa autenticação biométrica
      const biometricResult = await this.authenticate('Use sua biometria para fazer login');
      
      if (biometricResult.success) {
        return {
          success: true,
          email: credentials.email,
          password: credentials.password,
        };
      } else {
        return {
          success: false,
          error: biometricResult.error,
        };
      }
    } catch (error) {
      console.error('Erro no login biométrico:', error);
      return {
        success: false,
        error: 'Erro interno no login biométrico',
      };
    }
  }

  /**
   * Configura autenticação biométrica após login bem-sucedido
   */
  async setupBiometricAfterLogin(email: string, password: string): Promise<boolean> {
    try {
      const capabilities = await this.checkCapabilities();
      
      if (!capabilities.isAvailable || !capabilities.isEnrolled) {
        return false;
      }

      // Salva credenciais
      const saved = await this.saveUserCredentials(email, password);
      if (!saved) {
        return false;
      }

      // Habilita biometria
      return await this.enableBiometric();
    } catch (error) {
      console.error('Erro ao configurar biometria:', error);
      return false;
    }
  }
}

export default new BiometricAuthService();


