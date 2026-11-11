import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsibleSection } from '@/src/components/CollapsibleSection';
import { FactTile } from '@/src/components/FactTile';
import { GlowCard } from '@/src/components/GlowCard';
import { Ornament } from '@/src/components/Ornament';
import { PressableScale } from '@/src/components/PressableScale';
import { ScreenBackground } from '@/src/components/ScreenBackground';
import type { IconName, LoreSection } from '@/src/data/types';
import { useBookmarks } from '@/src/hooks/useBookmarks';
import { useRegion } from '@/src/hooks/useRegions';
import { colors, fonts, radius, spacing, type } from '@/src/theme/tokens';

const HERO_HEIGHT = 340;
const WORDS_PER_MINUTE = 220;

export default function LoreReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { region } = useRegion(id);
  const { isBookmarked, toggle } = useBookmarks();

  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(1);
  const viewportHeight = useSharedValue(1);
  const [viewport, setViewport] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    contentHeight.value = e.contentSize.height;
    viewportHeight.value = e.layoutMeasurement.height;
  });

  // Hero parallax + fade.
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, HERO_HEIGHT], [-50, 0, HERO_HEIGHT * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-120, 0], [1.15, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.8], [1, 0.2], Extrapolation.CLAMP),
  }));

  // Compact top bar appears once the hero title scrolls away.
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT - 140, HERO_HEIGHT - 80], [0, 1], Extrapolation.CLAMP),
  }));

  // Reading progress (0 -> 1).
  const progressStyle = useAnimatedStyle(() => {
    const max = Math.max(1, contentHeight.value - viewportHeight.value);
    return { width: `${Math.min(100, Math.max(0, (scrollY.value / max) * 100))}%` };
  });

  if (!region) {
    return (
      <ScreenBackground>
        <View style={[styles.missing, { paddingTop: insets.top + 80 }]}>
          <MaterialCommunityIcons name="map-marker-question-outline" size={48} color={colors.gold} />
          <Text style={type.h2}>This chronicle is lost</Text>
          <Text style={type.bodySmall}>No region found for “{id}”.</Text>
          <Pressable onPress={() => router.back()} style={styles.missingBtn}>
            <Text style={styles.missingBtnText}>Return to the Journal</Text>
          </Pressable>
        </View>
      </ScreenBackground>
    );
  }

  const [accent, deep] = region.accent;
  const bookmarked = isBookmarked(region.id);
  const minutes = Math.max(1, Math.round(countWords(region.sections) / WORDS_PER_MINUTE));

  return (
    <ScreenBackground tint={accent}>
      {/* Hero (behind the scroll view) */}
      <Animated.View style={[styles.hero, heroStyle]} pointerEvents="none">
        <LinearGradient colors={[deep, `${deep}00`]} style={StyleSheet.absoluteFill} />
        <MaterialCommunityIcons name={region.icon} size={300} color={accent} style={styles.heroGlyph} />
        <LinearGradient
          colors={['transparent', colors.bg]}
          start={{ x: 0.5, y: 0.35 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e: LayoutChangeEvent) => setViewport(e.nativeEvent.layout.height)}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl, minHeight: viewport }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero text */}
        <View style={[styles.heroText, { paddingTop: insets.top + 96 }]}>
          <Animated.Text entering={FadeInDown.duration(450)} style={[type.overline, { color: accent }]}>
            {region.epithet}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(60).duration(450)} style={styles.heroTitle}>
            {region.name}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(120).duration(450)} style={styles.heroTagline}>
            {region.tagline}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(180).duration(450)} style={styles.metaRow}>
            <Meta icon="clock-outline" text={`${minutes} min read`} />
            <Meta icon="book-open-variant" text={`${region.sections.length} chapters`} />
            <Meta icon="account-group-outline" text={`${region.champions.length} champions`} />
          </Animated.View>
        </View>

        <View style={styles.body}>
          {/* At a glance */}
          <Text style={[type.overline, styles.blockLabel]}>At a glance</Text>
          <View style={styles.facts}>
            <FactTile icon="castle" label="Seat of power" value={region.capital} accent={accent} />
            <FactTile icon="gavel" label="Governance" value={region.governance} accent={accent} />
            <FactTile icon="auto-fix" label="Magic" value={region.magicStance} accent={accent} />
            <FactTile icon="account-star-outline" label="Notable" value={region.champions.slice(0, 2).join(', ')} accent={accent} />
          </View>

          <Ornament color={accent} />

          {/* Chronicle */}
          <Text style={[type.overline, styles.blockLabel]}>The Chronicle</Text>
          {region.sections.map((section, i) => (
            <CollapsibleSection key={section.id} title={section.title} index={i} accent={accent} initiallyOpen={i === 0}>
              {section.paragraphs.map((p, pi) => (
                <Text key={pi} style={[styles.paragraph, pi === 0 && i === 0 && styles.lead]}>
                  {p}
                </Text>
              ))}
              {section.quote ? (
                <View style={[styles.quote, { borderLeftColor: accent, backgroundColor: `${accent}10` }]}>
                  <MaterialCommunityIcons name="format-quote-open" size={22} color={accent} />
                  <Text style={styles.quoteText}>{section.quote.text}</Text>
                  <Text style={[styles.quoteBy, { color: accent }]}>— {section.quote.attribution}</Text>
                </View>
              ) : null}
            </CollapsibleSection>
          ))}

          {/* Champions */}
          <Text style={[type.overline, styles.blockLabel, { marginTop: spacing.xl }]}>Champions of {region.name}</Text>
          <View style={styles.champions}>
            {region.champions.map((c) => (
              <View key={c} style={[styles.champion, { borderColor: `${accent}44` }]}>
                <Text style={styles.championInitial}>{c.charAt(0)}</Text>
                <Text style={styles.championName}>{c}</Text>
              </View>
            ))}
          </View>

          {/* Storyteller CTA */}
          <PressableScale
            style={{ marginTop: spacing.xl }}
            onPress={() => router.push({ pathname: '/tales', params: { region: region.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Begin a tale in ${region.name}`}
          >
            <GlowCard border={[accent, `${accent}10`]} contentStyle={styles.cta}>
              <MaterialCommunityIcons name="feather" size={24} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Begin a tale in {region.name}</Text>
                <Text style={type.bodySmall}>Let the storyteller weave your own adventure here.</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={22} color={accent} />
            </GlowCard>
          </PressableScale>
        </View>
      </Animated.ScrollView>

      {/* Top chrome: compact bar + progress */}
      <View style={[styles.chrome, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, styles.chromeBg, barStyle]} />
        <View style={styles.chromeRow} pointerEvents="box-none">
          <IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
          <Animated.Text style={[styles.chromeTitle, barStyle]} numberOfLines={1}>
            {region.name}
          </Animated.Text>
          <IconButton
            icon={bookmarked ? 'bookmark' : 'bookmark-outline'}
            label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            color={bookmarked ? colors.gold : colors.text}
            onPress={() => toggle(region.id)}
          />
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { backgroundColor: accent }, progressStyle]} />
        </View>
      </View>
    </ScreenBackground>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.meta}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function IconButton({ icon, label, onPress, color = colors.text }: { icon: IconName; label: string; onPress: () => void; color?: string }) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.iconBtn} scaleTo={0.9}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </PressableScale>
  );
}

const countWords = (sections: LoreSection[]) =>
  sections.reduce((n, s) => n + s.paragraphs.join(' ').split(/\s+/).length + (s.quote?.text.split(/\s+/).length ?? 0), 0);

const styles = StyleSheet.create({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT + 60, overflow: 'hidden' },
  heroGlyph: { position: 'absolute', right: -70, top: 30, opacity: 0.16 },
  heroText: { paddingHorizontal: spacing.lg, minHeight: HERO_HEIGHT, justifyContent: 'flex-end', paddingBottom: spacing.xl, gap: 6 },
  heroTitle: { fontFamily: fonts.display, fontSize: 42, lineHeight: 50, color: colors.goldBright, letterSpacing: 1.5 },
  heroTagline: { ...type.body, color: colors.text, opacity: 0.85 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(14,16,24,0.75)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  metaText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted },

  body: { paddingHorizontal: spacing.lg },
  blockLabel: { marginBottom: spacing.md },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  paragraph: { ...type.body, color: colors.text, opacity: 0.92, marginBottom: spacing.lg },
  lead: { fontSize: 17, lineHeight: 28, opacity: 1 },
  quote: { borderLeftWidth: 3, borderRadius: radius.sm, padding: spacing.lg, gap: 6, marginTop: spacing.xs },
  quoteText: { fontFamily: fonts.displayRegular, fontSize: 16, lineHeight: 25, color: colors.goldBright, fontStyle: 'italic' },
  quoteBy: { fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 0.5 },

  champions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  champion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  championInitial: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 28,
    overflow: 'hidden',
    backgroundColor: colors.surfaceHigh,
    color: colors.gold,
    fontFamily: fonts.display,
    fontSize: 13,
  },
  championName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },

  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 18, backgroundColor: colors.bgElevated },
  ctaTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text, marginBottom: 2 },

  chrome: { position: 'absolute', top: 0, left: 0, right: 0 },
  chromeBg: { backgroundColor: 'rgba(7,8,13,0.94)', borderBottomWidth: 1, borderBottomColor: colors.hairline },
  chromeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, height: 56 },
  chromeTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.goldBright,
    marginHorizontal: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,23,36,0.8)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  progressTrack: { height: 2, backgroundColor: 'transparent' },
  progressFill: { height: 2 },

  missing: { flex: 1, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  missingBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  missingBtnText: { fontFamily: fonts.bodySemi, color: colors.gold },
});
