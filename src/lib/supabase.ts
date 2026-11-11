import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True when the app was built with Supabase credentials. Otherwise it runs in offline mode. */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT-REF'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Only refresh tokens while the app is in the foreground (recommended by Supabase for RN).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/**
 * Make sure there is a signed-in user. Uses Supabase anonymous sign-in so readers
 * get a private journal without a sign-up form; you can later link an email/OAuth
 * identity with supabase.auth.updateUser / linkIdentity.
 */
export async function ensureSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signIn.session;
}
