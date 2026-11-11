import { useCallback, useEffect, useState } from 'react';

import { REGIONS } from '@/src/data/regions';
import { rowToRegion, type Region, type RegionRow } from '@/src/data/types';
import { supabase } from '@/src/lib/supabase';

type Source = 'bundled' | 'supabase';

/**
 * Loads regions from Supabase when configured, falling back to the bundled lore
 * so the app is always usable offline.
 */
export function useRegions() {
  const [regions, setRegions] = useState<Region[]>(REGIONS);
  const [source, setSource] = useState<Source>('bundled');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('regions')
      .select('*')
      .order('sort_order', { ascending: true });
    if (err) {
      setError(err.message);
    } else if (data && data.length > 0) {
      setRegions((data as RegionRow[]).map(rowToRegion));
      setSource('supabase');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { regions, source, loading, error, refresh: load };
}

export function useRegion(id: string | undefined) {
  const { regions, loading } = useRegions();
  return { region: regions.find((r) => r.id === id), loading };
}
