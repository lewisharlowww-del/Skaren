"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getCache, setCache } from "@/lib/clientCache";
import type { ScanRecord } from "@/lib/types";

export function useScans(user: User | null) {
  const cacheKey = user ? `scans:${user.id}` : "scans:anon";
  const cached = getCache<ScanRecord[]>(cacheKey);
  const [scans, setScans] = useState<ScanRecord[]>(cached ?? []);
  // Only block with the full-screen loader when we have nothing cached to show.
  const [loading, setLoading] = useState(cached === undefined);

  const loadScans = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setScans([]);
      setLoading(false);
      return;
    }

    // Stale-while-revalidate: if we already have cached scans, keep showing them
    // and refetch quietly (no loader flash on tab switches).
    const key = `scans:${user.id}`;
    if (getCache<ScanRecord[]>(key) === undefined) {
      setLoading(true);
    }

    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const next = data ?? [];
    setScans(next);
    setCache(key, next);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadScans();
  }, [loadScans]);

  const clearHistory = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) return false;

    const scansResult = await supabase
      .from("scans")
      .delete()
      .eq("user_id", user.id);
    if (scansResult.error) return false;

    setScans([]);
    setCache(`scans:${user.id}`, []);

    // Stats history is a secondary mirror; clearing the visible history should
    // still succeed if that table is unavailable in an older deployment.
    await supabase.from("scan_history").delete().eq("user_id", user.id);
    return true;
  }, [user]);

  return { scans, loading, clearHistory, refresh: loadScans };
}
