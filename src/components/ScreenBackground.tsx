import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

interface Props {
  /** Tint for the top glow, e.g. a region accent. Defaults to hextech gold. */
  tint?: string;
}

/** Full-screen dark backdrop with a soft coloured glow at the top and an arcane glow at the bottom. */
export function ScreenBackground({ tint = colors.gold, children }: PropsWithChildren<Props>) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[`${tint}33`, 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', `${colors.arcane}14`]}
        style={styles.bottomGlow}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  bottomGlow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 280 },
});
