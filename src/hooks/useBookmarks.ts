import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'rj.bookmarks.v1';

// Tiny shared store so every screen sees the same bookmarks without a context provider.
let bookmarks: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      bookmarks = JSON.parse(raw);
      emit();
    }
  } catch {
    // Storage unavailable; bookmarks simply stay in memory.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => listeners.delete(listener);
}

export function useBookmarks() {
  const ids = useSyncExternalStore(subscribe, () => bookmarks);

  const toggle = useCallback((id: string) => {
    bookmarks = bookmarks.includes(id) ? bookmarks.filter((b) => b !== id) : [id, ...bookmarks];
    emit();
    AsyncStorage.setItem(KEY, JSON.stringify(bookmarks)).catch(() => {});
  }, []);

  return { ids, isBookmarked: (id: string) => ids.includes(id), toggle };
}
