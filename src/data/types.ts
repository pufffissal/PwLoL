import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface LoreSection {
  id: string;
  title: string;
  paragraphs: string[];
  /** Optional pull-quote rendered as a highlighted card inside the section. */
  quote?: { text: string; attribution: string };
}

export interface Region {
  id: string;
  name: string;
  epithet: string;
  tagline: string;
  icon: IconName;
  /** Two-stop gradient used for cards and the reader hero. */
  accent: [string, string];
  capital: string;
  governance: string;
  magicStance: string;
  champions: string[];
  featured?: boolean;
  sections: LoreSection[];
}

/** Row shape of the `regions` table in Supabase (see supabase/migrations). */
export interface RegionRow {
  id: string;
  name: string;
  epithet: string;
  tagline: string;
  icon: string;
  accent_from: string;
  accent_to: string;
  capital: string;
  governance: string;
  magic_stance: string;
  champions: string[];
  featured: boolean;
  sections: LoreSection[];
  sort_order: number;
}

export const rowToRegion = (r: RegionRow): Region => ({
  id: r.id,
  name: r.name,
  epithet: r.epithet,
  tagline: r.tagline,
  icon: r.icon as IconName,
  accent: [r.accent_from, r.accent_to],
  capital: r.capital,
  governance: r.governance,
  magicStance: r.magic_stance,
  champions: r.champions,
  featured: r.featured,
  sections: r.sections,
});
