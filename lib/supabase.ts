import { createClient } from "@supabase/supabase-js";
import type { ScanRecord } from "@/lib/types";

type Database = {
  public: {
    Tables: {
      scans: {
        Row: ScanRecord;
        Insert: Omit<ScanRecord, "id" | "created_at">;
        Update: Partial<Omit<ScanRecord, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// The browser client uses only the public anon key. Row-level security keeps user data private.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;
