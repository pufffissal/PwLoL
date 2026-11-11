import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.hairline,
    notification: colors.arcane,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade_from_bottom' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="region/[id]" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
