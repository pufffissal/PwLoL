import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/src/components/PressableScale';
import { ScreenBackground } from '@/src/components/ScreenBackground';
import type { IconName } from '@/src/data/types';
import { useRegions } from '@/src/hooks/useRegions';
import { askStoryteller, newId, parseReply, saveTale, type TaleMessage } from '@/src/lib/storyteller';
import { colors, fonts, radius, spacing, type } from '@/src/theme/tokens';

const OPENINGS = [
  'I arrive at the docks with nothing but a stolen map.',
  'I wake in a hextech workshop with no memory of last night.',
  'I am a scout tracking something huge through the snow.',
];

export default function TalesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ region?: string }>();
  const { regions } = useRegions();

  const [regionId, setRegionId] = useState<string | null>(params.region ?? null);
  const [messages, setMessages] = useState<TaleMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taleId = useRef<string | null>(null);
  const listRef = useRef<FlatList<TaleMessage>>(null);

  // Arriving from a Lore Reader "Begin a tale" button picks that region for a fresh tale.
  useEffect(() => {
    if (params.region && messages.length === 0) setRegionId(params.region);
  }, [params.region, messages.length]);

  const region = regions.find((r) => r.id === regionId) ?? null;
  const accent = region?.accent[0] ?? colors.arcane;

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const suggestions = useMemo(() => (lastAssistant ? parseReply(lastAssistant.content).suggestions : []), [lastAssistant]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || thinking) return;
      setError(null);
      setInput('');
      const userMsg: TaleMessage = { id: newId(), role: 'user', content, at: Date.now() };
      const history = [...messages, userMsg];
      setMessages(history);
      setThinking(true);
      try {
        const reply = await askStoryteller(history, regionId);
        const next = [...history, { id: newId(), role: 'assistant' as const, content: reply, at: Date.now() }];
        setMessages(next);
        taleId.current = await saveTale(taleId.current, regionId, next).catch(() => taleId.current);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setThinking(false);
      }
    },
    [messages, regionId, thinking],
  );

  const retry = () => {
    // Re-send the last user message if the storyteller failed to answer it.
    const last = messages[messages.length - 1];
    if (last?.role !== 'user') return;
    setMessages((m) => m.slice(0, -1));
    setTimeout(() => send(last.content), 0);
  };

  const newTale = () => {
    setMessages([]);
    setError(null);
    taleId.current = null;
  };

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, thinking]);

  return (
    <ScreenBackground tint={accent}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={[type.overline, { color: accent }]}>{region ? region.name : 'Anywhere in Runeterra'}</Text>
            <Text style={type.h1}>Runeterran Tales</Text>
          </View>
          {messages.length > 0 ? (
            <PressableScale onPress={newTale} style={styles.newBtn} accessibilityRole="button" accessibilityLabel="Start a new tale">
              <MaterialCommunityIcons name="feather" size={16} color={colors.gold} />
              <Text style={styles.newBtnText}>New tale</Text>
            </PressableScale>
          ) : null}
        </View>

        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.emptyWrap} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyHero}>
              <LinearGradient colors={[`${accent}33`, 'transparent']} style={styles.emptyGlow} />
              <MaterialCommunityIcons name="campfire" size={54} color={accent} />
              <Text style={[type.h2, { textAlign: 'center' }]}>Every legend begins with a choice</Text>
              <Text style={[type.bodySmall, { textAlign: 'center' }]}>
                Choose a realm, then tell the storyteller who you are and what you do. The tale bends to your words.
              </Text>
            </Animated.View>

            <Text style={[type.overline, styles.pickLabel]}>Choose a realm</Text>
            <ScrollView
              horizontal
              style={styles.hScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionChips}
              keyboardShouldPersistTaps="handled"
            >
              <RegionChip label="Anywhere" icon="compass-rose" color={colors.arcane} active={!regionId} onPress={() => setRegionId(null)} />
              {regions.map((r) => (
                <RegionChip
                  key={r.id}
                  label={r.name}
                  icon={r.icon}
                  color={r.accent[0]}
                  active={regionId === r.id}
                  onPress={() => setRegionId(r.id)}
                />
              ))}
            </ScrollView>

            <Text style={[type.overline, styles.pickLabel]}>Or begin with</Text>
            {OPENINGS.map((o, i) => (
              <Animated.View key={o} entering={FadeInUp.delay(150 + i * 80).duration(400)}>
                <PressableScale onPress={() => send(o)} style={styles.opening} accessibilityRole="button">
                  <MaterialCommunityIcons name="script-text-outline" size={18} color={accent} />
                  <Text style={styles.openingText}>{o}</Text>
                </PressableScale>
              </Animated.View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <Bubble message={item} accent={accent} />}
            ListFooterComponent={
              <>
                {thinking ? <TypingIndicator accent={accent} /> : null}
                {error ? (
                  <Animated.View entering={FadeIn} style={styles.errorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.retry} onPress={retry} accessibilityRole="button">
                      Retry
                    </Text>
                  </Animated.View>
                ) : null}
              </>
            }
          />
        )}

        {/* Suggestions */}
        {!thinking && suggestions.length > 0 ? (
          <ScrollView
            horizontal
            style={styles.hScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((s) => (
              <PressableScale key={s} onPress={() => send(s)} style={[styles.suggestion, { borderColor: `${accent}66` }]}>
                <Text style={[styles.suggestionText, { color: accent }]}>» {s}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={thinking ? 'The storyteller is weaving…' : 'What do you do?'}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            maxLength={2000}
            editable={!thinking}
            accessibilityLabel="Your action"
          />
          <PressableScale
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
            style={[styles.sendBtn, { backgroundColor: input.trim() && !thinking ? accent : colors.surfaceHigh }]}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <MaterialCommunityIcons name="send" size={20} color={input.trim() && !thinking ? colors.bg : colors.textFaint} />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

function Bubble({ message, accent }: { message: TaleMessage; accent: string }) {
  if (message.role === 'user') {
    return (
      <Animated.View
        entering={FadeInUp.duration(250)}
        style={[styles.userBubble, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}
      >
        <Text style={styles.userText}>{message.content}</Text>
      </Animated.View>
    );
  }
  const { text } = parseReply(message.content);
  return (
    <Animated.View entering={FadeInUp.duration(350)} style={styles.storyCard}>
      <View style={styles.storyHead}>
        <MaterialCommunityIcons name="book-open-page-variant" size={14} color={colors.gold} />
        <Text style={styles.storyLabel}>Storyteller</Text>
      </View>
      <Text style={styles.storyText}>{text}</Text>
    </Animated.View>
  );
}

function RegionChip({
  label,
  icon,
  color,
  active,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.regionChip,
        { borderColor: active ? color : colors.hairline, backgroundColor: active ? `${color}22` : colors.surface },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={[styles.regionChipText, active && { color: colors.text }]}>{label}</Text>
    </PressableScale>
  );
}

function TypingIndicator({ accent }: { accent: string }) {
  return (
    <View style={styles.typing} accessibilityLabel="Storyteller is writing">
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 160} color={accent} />
      ))}
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0.25, { duration: 380 })), -1));
  }, [delay, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: 0.8 + o.value * 0.3 }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  newBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.gold },

  emptyWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyHero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  emptyGlow: { position: 'absolute', top: 0, width: 220, height: 220, borderRadius: 110 },
  pickLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  regionChips: { gap: spacing.sm, paddingRight: spacing.lg },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  regionChipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
  opening: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  openingText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
    borderWidth: 1,
  },
  userText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  storyCard: {
    alignSelf: 'stretch',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderTopLeftRadius: 4,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  storyLabel: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.5, color: colors.gold },
  storyText: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: 25, color: colors.text },

  typing: { flexDirection: 'row', gap: 6, padding: spacing.lg, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(232,64,87,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,64,87,0.35)',
    marginTop: spacing.sm,
  },
  errorText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  retry: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.gold, paddingHorizontal: 4 },

  hScroll: { flexGrow: 0 },
  suggestions: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  suggestion: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, backgroundColor: colors.bgElevated },
  suggestionText: { fontFamily: fonts.bodyMedium, fontSize: 13 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
