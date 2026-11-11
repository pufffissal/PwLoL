import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/src/theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.6 },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-open-page-variant-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tales"
        options={{
          title: 'Tales',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="campfire" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
