import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlowCard } from '@/src/components/GlowCard';
import { Ornament } from '@/src/components/Ornament';
import { PressableScale } from '@/src/components/PressableScale';
import { RegionCard } from '@/src/components/RegionCard';
import { ScreenBackground } from '@/src/components/ScreenBackground';
import type { Region } from '@/src/data/types';
import { useBookmarks } from '@/src/hooks/useBookmarks';
import { useRegions } from '@/src/hooks/useRegions';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { colors, fonts, radius, spacing, type } from '@/src/theme/tokens';

const GUTTER = spacing.lg;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { regions, source, loading, refresh } = useRegions();
  const { ids: bookmarkIds, isBookmarked } = useBookmarks();
  const [query, setQuery] = useState('');

  const featured = useMemo(() => regions.filter((r) => r.featured), [regions]);
  const saved = useMemo(
    () => bookmarkIds.map((id) => regions.find((r) => r.id === id)).filter((r): r is Region => Boolean(r)),
    [bookmarkIds, regions],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.epithet.toLowerCase().includes(q) || r.champions.some((c) => c.toLowerCase().includes(q)),
    );
  }, [query, regions]);

  const rows = useMemo(() => chunk(filtered, 2), [filtered]);
  const openRegion = (id: string) => router.push({ pathname: '/region/[id]', params: { id } });
  const searching = query.trim().length > 0;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          isSupabaseConfigured ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={type.overline}>Welcome back, Summoner</Text>
            <View style={[styles.sourceChip, source === 'supabase' && styles.sourceChipLive]}>
              <View style={[styles.dot, { backgroundColor: source === 'supabase' ? colors.arcane : colors.textFaint }]} />
              <Text style={styles.sourceText}>{source === 'supabase' ? 'Synced' : 'Offline lore'}</Text>
            </View>
          </View>
          <Text style={[type.hero, styles.title]}>Runeterra{'\n'}Journal</Text>
          <Text style={type.bodySmall}>Chronicles of every realm, from the brass spires of Piltover to the edges of the Void.</Text>
        </Animated.View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search regions or champions"
            placeholderTextColor={colors.textFaint}
            style={styles.search}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search regions or champions"
          />
          {searching ? (
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={colors.textMuted}
              onPress={() => setQuery('')}
              accessibilityLabel="Clear search"
            />
          ) : null}
        </View>

        {!searching ? (
          <>
            {/* Featured carousel */}
            <SectionTitle title="Featured Realms" />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(r) => r.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={260 + spacing.md}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: GUTTER, gap: spacing.md, paddingVertical: spacing.sm }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(120 + index * 80).duration(450)}>
                  <RegionCard region={item} variant="featured" bookmarked={isBookmarked(item.id)} onPress={() => openRegion(item.id)} />
                </Animated.View>
              )}
            />

            {/* Tales CTA */}
            <View style={[styles.padded, { marginTop: spacing.lg }]}>
              <PressableScale onPress={() => router.push('/tales')} accessibilityRole="button" accessibilityLabel="Open Runeterran Tales">
                <GlowCard border={[colors.arcane, 'rgba(10,200,185,0.05)']} contentStyle={styles.ctaInner}>
                  <LinearGradient
                    colors={['rgba(10,200,185,0.16)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.ctaIcon}>
                    <MaterialCommunityIcons name="campfire" size={26} color={colors.arcane} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.overline, { color: colors.arcane }]}>Runeterran Tales</Text>
                    <Text style={styles.ctaTitle}>Sit by the fire. A storyteller awaits.</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.arcane} />
                </GlowCard>
              </PressableScale>
            </View>

            {/* Saved */}
            {saved.length > 0 ? (
              <>
                <SectionTitle title="Saved Chronicles" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {saved.map((r) => (
                    <PressableScale key={r.id} onPress={() => openRegion(r.id)} style={[styles.chip, { borderColor: `${r.accent[0]}66` }]}>
                      <MaterialCommunityIcons name={r.icon} size={16} color={r.accent[0]} />
                      <Text style={styles.chipText}>{r.name}</Text>
                    </PressableScale>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </>
        ) : null}

        {/* Grid */}
        <SectionTitle title={searching ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}` : 'All Regions'} />
        <View style={styles.padded}>
          {rows.map((row, i) => (
            <Animated.View
              key={row.map((r) => r.id).join('-')}
              entering={FadeInDown.delay(Math.min(i, 6) * 60).duration(400)}
              style={styles.gridRow}
            >
              {row.map((r) => (
                <RegionCard key={r.id} region={r} bookmarked={isBookmarked(r.id)} onPress={() => openRegion(r.id)} />
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </Animated.View>
          ))}
          {filtered.length === 0 ? <Text style={[type.bodySmall, styles.empty]}>No chronicle matches “{query}”.</Text> : null}
        </View>

        <View style={styles.padded}>
          <Ornament />
          <Text style={styles.footer}>Runeterra Journal is an unofficial fan project and is not endorsed by Riot Games.</Text>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionMark} />
      <Text style={type.h2}>{title}</Text>
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: GUTTER, gap: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 38, lineHeight: 44, marginTop: spacing.xs },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElevated,
  },
  sourceChipLive: { borderColor: colors.arcaneGlow },
  dot: { width: 6, height: 6, borderRadius: 3 },
  sourceText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: GUTTER,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 15, paddingVertical: 0 },

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: GUTTER,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionMark: { width: 6, height: 6, backgroundColor: colors.gold, transform: [{ rotate: '45deg' }] },

  padded: { paddingHorizontal: GUTTER },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 18, backgroundColor: colors.bgElevated },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,200,185,0.12)',
    borderWidth: 1,
    borderColor: colors.arcaneGlow,
  },
  ctaTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.text, marginTop: 4 },

  chips: { paddingHorizontal: GUTTER, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },

  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.lg },
  footer: { ...type.bodySmall, fontSize: 12, textAlign: 'center', color: colors.textFaint },
});
