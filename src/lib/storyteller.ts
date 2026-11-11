import { FunctionsHttpError } from '@supabase/supabase-js';

import { ensureSession, supabase } from './supabase';

export type Role = 'user' | 'assistant';

export interface TaleMessage {
  id: string;
  role: Role;
  content: string;
  at: number;
}

export interface StorytellerReply {
  text: string;
  suggestions: string[];
}

const SUGGESTION_PREFIX = /^\s*(?:»|>>)\s*/;

/** Split the storyteller's reply into narrative text and the "» ..." suggested actions. */
export function parseReply(raw: string): StorytellerReply {
  const lines = raw.split('\n');
  const suggestions = lines.filter((l) => SUGGESTION_PREFIX.test(l)).map((l) => l.replace(SUGGESTION_PREFIX, '').trim());
  const text = lines
    .filter((l) => !SUGGESTION_PREFIX.test(l))
    .join('\n')
    .trim();
  return { text, suggestions: suggestions.slice(0, 3) };
}

/** Ask the "storyteller" Supabase Edge Function for the next story beat. */
export async function askStoryteller(history: TaleMessage[], regionId: string | null): Promise<string> {
  if (!supabase) return offlineReply(history, regionId);

  await ensureSession();
  const { data, error } = await supabase.functions.invoke<{ reply?: string; error?: string }>('storyteller', {
    body: { regionId, messages: history.map(({ role, content }) => ({ role, content })) },
  });

  if (error) {
    // Surface the function's own error message (rate limit, etc.) when there is one.
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? 'The storyteller could not be reached.');
    }
    throw new Error('The storyteller could not be reached. Check your connection.');
  }
  if (!data?.reply) throw new Error(data?.error ?? 'The storyteller fell silent.');
  return data.reply;
}

/** Persist a tale to Supabase (RLS keeps it private to the signed-in user). Returns the tale id. */
export async function saveTale(taleId: string | null, regionId: string | null, messages: TaleMessage[]) {
  if (!supabase) return taleId;
  await ensureSession();
  const firstUser = messages.find((m) => m.role === 'user')?.content ?? 'Untitled tale';
  const row = {
    region_id: regionId,
    title: firstUser.slice(0, 60),
    messages,
    updated_at: new Date().toISOString(),
  };
  if (taleId) {
    await supabase.from('tales').update(row).eq('id', taleId);
    return taleId;
  }
  const { data } = await supabase.from('tales').insert(row).select('id').single();
  return (data?.id as string | undefined) ?? null;
}

/** Demo narrator used when the app is built without Supabase credentials. */
function offlineReply(history: TaleMessage[], regionId: string | null): Promise<string> {
  const turn = history.filter((m) => m.role === 'user').length;
  const place = regionId ? regionId.replace(/-/g, ' ') : 'the crossroads of Runeterra';
  const text =
    turn <= 1
      ? `The fire crackles as you settle in. Beyond the circle of light, the road toward ${place} disappears into mist. An old storyteller with ink-stained fingers looks up and smiles.\n\n“The full tale needs the arcane link to be opened,” they say, tapping a dormant hextech crystal. “Until then, I can only whisper.”\n\n(This build runs in offline mode. Connect Supabase and the Claude-powered Edge Function to unlock the full storyteller: see docs/BACKEND.md.)`
      : `The storyteller nods slowly, eyes on the embers. “A fine choice. The rest of that path is written in a book I cannot open yet.”\n\n(Offline mode: configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to continue the story.)`;
  return new Promise((resolve) =>
    setTimeout(() => resolve(`${text}\n» Look into the mist\n» Ask about the crystal\n» Warm your hands by the fire`), 700),
  );
}

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
