import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/src/theme/tokens';

interface Props {
  /** Gradient used for the 1px border. */
  border?: [string, string];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Card with a thin gradient border (gold -> transparent by default) on a dark surface.
 * The border is drawn by padding a LinearGradient by 1px, which looks crisp on every platform.
 */
export function GlowCard({
  border = [colors.borderStrong, 'rgba(200,170,110,0.04)'],
  style,
  contentStyle,
  children,
}: PropsWithChildren<Props>) {
  return (
    <LinearGradient colors={border} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.border, style]}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  border: { borderRadius: radius.lg, padding: 1 },
  inner: {
    borderRadius: radius.lg - 1,
    backgroundColor: colors.surface,
    padding: 16,
    overflow: 'hidden',
  },
});
