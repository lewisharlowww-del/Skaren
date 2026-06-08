"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ScanRecord } from "@/lib/types";

export function useScans(user: User | null) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScans = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setScans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setScans(data ?? []);
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

    // Stats history is a secondary mirror; clearing the visible history should
    // still succeed if that table is unavailable in an older deployment.
    await supabase.from("scan_history").delete().eq("user_id", user.id);
    return true;
  }, [user]);

  return { scans, loading, clearHistory, refresh: loadScans };
}
