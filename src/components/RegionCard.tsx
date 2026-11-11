import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Region } from '@/src/data/types';
import { colors, fonts, glow, radius, type } from '@/src/theme/tokens';
import { PressableScale } from './PressableScale';

interface Props {
  region: Region;
  variant?: 'featured' | 'grid';
  bookmarked?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RegionCard({ region, variant = 'grid', bookmarked, onPress, style }: Props) {
  const [from, to] = region.accent;
  const featured = variant === 'featured';

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${region.name}, ${region.epithet}`}
      accessibilityHint="Opens the lore reader"
      style={[featured ? styles.featured : styles.grid, featured && glow(from, 0.35), style]}
    >
      {/* Gradient border */}
      <LinearGradient colors={[`${from}AA`, `${from}10`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border}>
        <View style={styles.inner}>
          {/* Region-coloured wash */}
          <LinearGradient
            colors={[`${to}`, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Watermark glyph */}
          <MaterialCommunityIcons
            name={region.icon}
            size={featured ? 190 : 110}
            color={from}
            style={[styles.watermark, featured ? styles.watermarkFeatured : styles.watermarkGrid]}
          />

          <View style={styles.topRow}>
            <View style={[styles.badge, { borderColor: `${from}88`, backgroundColor: `${from}1F` }]}>
              <MaterialCommunityIcons name={region.icon} size={featured ? 22 : 18} color={from} />
            </View>
            {bookmarked ? <MaterialCommunityIcons name="bookmark" size={18} color={colors.gold} /> : null}
          </View>

          <View style={styles.flex} />

          <Text style={[type.overline, { color: from }]} numberOfLines={1}>
            {region.epithet}
          </Text>
          <Text style={featured ? styles.nameFeatured : styles.nameGrid} numberOfLines={1} adjustsFontSizeToFit>
            {region.name}
          </Text>
          {featured ? (
            <Text style={styles.tagline} numberOfLines={2}>
              {region.tagline}
            </Text>
          ) : null}

          <View style={[styles.accentBar, { backgroundColor: from }]} />
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  featured: { width: 260, height: 330, borderRadius: radius.xl },
  grid: { flex: 1, height: 170, borderRadius: radius.lg },
  border: { flex: 1, borderRadius: radius.lg, padding: 1 },
  inner: {
    flex: 1,
    borderRadius: radius.lg - 1,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: colors.surface,
  },
  watermark: { position: 'absolute', opacity: 0.12 },
  watermarkFeatured: { right: -40, top: 30 },
  watermarkGrid: { right: -24, top: -10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  nameFeatured: { fontFamily: fonts.display, fontSize: 28, color: colors.goldBright, marginTop: 4, letterSpacing: 1 },
  nameGrid: { fontFamily: fonts.display, fontSize: 18, color: colors.goldBright, marginTop: 2, letterSpacing: 0.6 },
  tagline: { ...type.bodySmall, marginTop: 6, color: colors.text, opacity: 0.8 },
  accentBar: { position: 'absolute', left: 16, bottom: 0, width: 36, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
});
