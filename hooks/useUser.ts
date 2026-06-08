"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 4000);

    async function loadUser() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // The local session is enough for UI state and avoids a blocking
        // network validation request on every page navigation.
        const { data } = await supabase.auth.getSession();
        if (active) setUser(data.session?.user ?? null);
      } finally {
        if (active) {
          window.clearTimeout(timeout);
          setLoading(false);
        }
      }
    }

    loadUser();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isConfigured: isSupabaseConfigured };
}
