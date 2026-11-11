import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/src/data/types';
import { colors, fonts, radius } from '@/src/theme/tokens';

interface Props {
  icon: IconName;
  label: string;
  value: string;
  accent: string;
}

/** Small key-fact tile used in the Lore Reader's "At a glance" grid. */
export function FactTile({ icon, label, value, accent }: Props) {
  return (
    <View style={styles.tile}>
      <MaterialCommunityIcons name={icon} size={18} color={accent} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    gap: 4,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.textMuted, marginTop: 6 },
  value: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, lineHeight: 19 },
});
