import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, radius, spacing } from '@/src/theme/tokens';

interface Props {
  title: string;
  index: number;
  accent: string;
  initiallyOpen?: boolean;
}

/**
 * Accordion section for the Lore Reader. Uses Reanimated layout transitions so the
 * content below slides smoothly instead of jumping when a section opens or closes.
 */
export function CollapsibleSection({ title, index, accent, initiallyOpen = false, children }: PropsWithChildren<Props>) {
  const [open, setOpen] = useState(initiallyOpen);
  const rotation = useSharedValue(initiallyOpen ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, { duration: 220 });
  }, [open, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View layout={LinearTransition.duration(240)} style={[styles.card, open && { borderColor: `${accent}55` }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title} section`}
        android_ripple={{ color: `${accent}22` }}
      >
        <Text style={[styles.index, { color: accent }]}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={styles.title}>{title}</Text>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-down" size={22} color={open ? accent : colors.textMuted} />
        </Animated.View>
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={styles.body}>
          <View style={[styles.rule, { backgroundColor: `${accent}40` }]} />
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 18, gap: spacing.md },
  index: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.5 },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 17, color: colors.goldBright, letterSpacing: 0.8 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  rule: { height: 1, marginBottom: spacing.lg },
});
