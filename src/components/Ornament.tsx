import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme/tokens';

/** Gold hairline divider with a small rotated diamond in the middle. */
export function Ornament({ color = colors.gold }: { color?: string }) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['transparent', color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.line} />
      <View style={[styles.diamond, { borderColor: color }]} />
      <LinearGradient colors={[color, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  diamond: { width: 8, height: 8, borderWidth: 1.5, transform: [{ rotate: '45deg' }] },
});
