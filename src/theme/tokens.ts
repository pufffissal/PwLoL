/**
 * Design tokens for Runeterra Journal.
 *
 * Palette idea: deep "void" blacks with a blue undertone, hextech gold as the
 * primary accent, and a cool arcane cyan as the secondary "neon" accent.
 * Every region also has its own accent pair (see src/data/regions.ts).
 */
export const colors = {
  bg: '#07080D',
  bgElevated: '#0E1018',
  surface: '#141724',
  surfaceHigh: '#1B1F30',
  border: 'rgba(200, 170, 110, 0.18)',
  borderStrong: 'rgba(200, 170, 110, 0.45)',
  hairline: 'rgba(255, 255, 255, 0.06)',

  gold: '#C8AA6E',
  goldBright: '#F0E6D2',
  goldDeep: '#785A28',
  arcane: '#0AC8B9',
  arcaneGlow: 'rgba(10, 200, 185, 0.35)',

  text: '#F0E6D2',
  textMuted: '#A09B8C',
  textFaint: '#5B5A56',

  danger: '#E84057',
  success: '#2BD9A3',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Font family names registered in app/_layout.tsx via @expo-google-fonts. */
export const fonts = {
  display: 'Cinzel_700Bold',
  displayRegular: 'Cinzel_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 30, letterSpacing: 1.5, color: colors.goldBright },
  h1: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 1.2, color: colors.goldBright },
  h2: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 1, color: colors.goldBright },
  overline: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase' as const,
    color: colors.gold,
  },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26, color: colors.text },
  bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
} as const;

/** Soft coloured glow. Android uses elevation (shadowColor is honoured on API 28+). */
export const glow = (color: string, intensity = 0.55) => ({
  shadowColor: color,
  shadowOpacity: intensity,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 0 },
  elevation: 10,
});
