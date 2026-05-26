"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    }

    loadUser();

    const listener = supabase?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isConfigured: isSupabaseConfigured };
}
