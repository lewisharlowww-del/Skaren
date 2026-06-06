"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  NewShoppingListItem,
  ShoppingListItem
} from "@/types/shopping-list";

const storageKey = "skaren:shopping-list:v1";
const updateEvent = "skaren:shopping-list-updated";

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

function readLocalItems() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as ShoppingListItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalItems(items: ShoppingListItem[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(updateEvent, { detail: items }));
}

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toItem(row: ShoppingListRow): ShoppingListItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity ?? undefined,
    category: row.category ?? undefined,
    healthGrade: row.health_grade ?? undefined,
    addedFromScan: row.added_from_scan,
    checked: row.checked,
    createdAt: row.created_at
  };
}

function toRow(item: ShoppingListItem, userId: string): ShoppingListRow {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    quantity: item.quantity ?? null,
    category: item.category ?? null,
    health_grade: item.healthGrade ?? null,
    added_from_scan: item.addedFromScan,
    checked: item.checked,
    created_at: item.createdAt
  };
}

export function useShoppingList() {
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const updateItems = useCallback(
    (
      updater:
        | ShoppingListItem[]
        | ((current: ShoppingListItem[]) => ShoppingListItem[])
    ) => {
      setItems((current) => {
        const next =
          typeof updater === "function" ? updater(current) : updater;
        writeLocalItems(next);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    function syncLocalItems(event: Event) {
      const detail = (event as CustomEvent<ShoppingListItem[]>).detail;
      setItems(detail ?? readLocalItems());
    }

    window.addEventListener(updateEvent, syncLocalItems);
    return () => window.removeEventListener(updateEvent, syncLocalItems);
  }, []);

  useEffect(() => {
    if (userLoading) return;
    let active = true;

    async function loadItems() {
      const localItems = readLocalItems();

      if (!isSupabaseConfigured || !supabase || !user) {
        if (active) {
          setItems(localItems);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("shopping_list")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (error) {
          setItems(localItems);
        } else {
          const remoteItems = (data as ShoppingListRow[]).map(toItem);
          setItems(remoteItems);
          writeLocalItems(remoteItems);
        }
      } catch {
        if (!active) return;
        setItems(localItems);
      }

      setLoading(false);
    }

    void loadItems();
    return () => {
      active = false;
    };
  }, [user, userLoading]);

  const addItem = useCallback(
    async (input: NewShoppingListItem) => {
      const item: ShoppingListItem = {
        id: createItemId(),
        name: input.name.trim(),
        quantity: input.quantity?.trim() || undefined,
        category: input.category || undefined,
        healthGrade: input.healthGrade,
        addedFromScan: input.addedFromScan,
        checked: false,
        createdAt: new Date().toISOString()
      };

      updateItems((current) => [item, ...current]);

      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase.from("shopping_list").insert(toRow(item, user.id));
        } catch {
          // Local storage remains the active fallback.
        }
      }

      return item;
    },
    [updateItems, user]
  );

  const toggleItem = useCallback(
    async (id: string) => {
      let checked = false;
      updateItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          checked = !item.checked;
          return { ...item, checked };
        })
      );

      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase
            .from("shopping_list")
            .update({ checked })
            .eq("id", id)
            .eq("user_id", user.id);
        } catch {
          // Local storage remains the active fallback.
        }
      }
    },
    [updateItems, user]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      updateItems((current) => current.filter((item) => item.id !== id));

      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase
            .from("shopping_list")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        } catch {
          // Local storage remains the active fallback.
        }
      }
    },
    [updateItems, user]
  );

  const clearChecked = useCallback(async () => {
    const checkedIds = items
      .filter((item) => item.checked)
      .map((item) => item.id);

    updateItems((current) => current.filter((item) => !item.checked));

    if (
      checkedIds.length > 0 &&
      isSupabaseConfigured &&
      supabase &&
      user
    ) {
      try {
        await supabase
          .from("shopping_list")
          .delete()
          .eq("user_id", user.id)
          .in("id", checkedIds);
      } catch {
        // Local storage remains the active fallback.
      }
    }
  }, [items, updateItems, user]);

  return {
    items,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked
  };
}
