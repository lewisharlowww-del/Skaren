import { createClient } from "@supabase/supabase-js";
import type { ScanRecord, StatsScanRecord } from "@/lib/types";
import type { ShoppingListItem } from "@/types/shopping-list";

type ShoppingListRow = {
  id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  health_grade: ShoppingListItem["healthGrade"] | null;
  added_from_scan: boolean;
  checked: boolean;
  created_at: string;
};

type InsightRow = {
  id?: string;
  user_id: string;
  week: string;
  text: string;
  created_at?: string;
};

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; is_premium: boolean };
        Insert: { id: string; is_premium?: boolean };
        Update: { is_premium?: boolean };
        Relationships: [];
      };
      scans: {
        Row: ScanRecord;
        Insert: Omit<ScanRecord, "id" | "created_at">;
        Update: Partial<Omit<ScanRecord, "id" | "created_at">>;
        Relationships: [];
      };
      scan_history: {
        Row: StatsScanRecord;
        Insert: Omit<StatsScanRecord, "id" | "created_at">;
        Update: Partial<Omit<StatsScanRecord, "id" | "created_at">>;
        Relationships: [];
      };
      insights: {
        Row: InsightRow;
        Insert: Omit<InsightRow, "id" | "created_at">;
        Update: Partial<Omit<InsightRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      shopping_list: {
        Row: ShoppingListRow;
        Insert: ShoppingListRow;
        Update: Partial<Omit<ShoppingListRow, "id" | "user_id" | "created_at">>;
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
