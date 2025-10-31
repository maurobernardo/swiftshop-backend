import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RootNavigation from './src/navigation';
import { AuthProvider } from './src/contexts/AuthContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { theme } from './src/theme';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <LinearGradient colors={[theme.colors.background, theme.colors.accentSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
          <RootNavigation />
          <StatusBar style="auto" />
        </LinearGradient>
      </FavoritesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
