"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function normalizeItemName(name: string) {
  return name
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("nb-NO");
}

function dedupeItems(items: ShoppingListItem[]) {
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  const uniqueItems = items.filter((item) => {
    const key = normalizeItemName(item.name);
    if (!key || seen.has(key)) {
      duplicateIds.push(item.id);
      return false;
    }

    seen.add(key);
    return true;
  });

  return { items: uniqueItems, duplicateIds };
}

function readLocalItems() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(storageKey);
    const parsed = value ? (JSON.parse(value) as ShoppingListItem[]) : [];
    return dedupeItems(parsed).items;
  } catch {
    return [];
  }
}

function writeLocalItems(items: ShoppingListItem[]) {
  const uniqueItems = dedupeItems(items).items;
  window.localStorage.setItem(storageKey, JSON.stringify(uniqueItems));
  window.dispatchEvent(new CustomEvent(updateEvent, { detail: uniqueItems }));
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
  // Seed synchronously from localStorage so the list renders instantly on tab
  // switches instead of flashing the full-screen loader while Supabase loads.
  const seedItems = typeof window !== "undefined" ? dedupeItems(readLocalItems()).items : [];
  const [items, setItems] = useState<ShoppingListItem[]>(seedItems);
  const [loading, setLoading] = useState(seedItems.length === 0);
  const itemsRef = useRef<ShoppingListItem[]>(seedItems);
  const pendingNamesRef = useRef(new Set<string>());

  const updateItems = useCallback(
    (
      updater:
        | ShoppingListItem[]
        | ((current: ShoppingListItem[]) => ShoppingListItem[])
    ) => {
      const nextItems =
        typeof updater === "function" ? updater(itemsRef.current) : updater;
      const next = dedupeItems(nextItems).items;

      itemsRef.current = next;
      setItems(next);
      writeLocalItems(next);
    },
    []
  );

  useEffect(() => {
    function syncLocalItems(event: Event) {
      const detail = (event as CustomEvent<ShoppingListItem[]>).detail;
      const next = dedupeItems(detail ?? readLocalItems()).items;
      itemsRef.current = next;
      setItems(next);
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
          itemsRef.current = localItems;
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
          itemsRef.current = localItems;
          setItems(localItems);
        } else {
          const remoteItems = (data as ShoppingListRow[]).map(toItem);
          const deduped = dedupeItems([...remoteItems, ...localItems]);
          itemsRef.current = deduped.items;
          setItems(deduped.items);
          writeLocalItems(deduped.items);
        }
      } catch {
        if (!active) return;
        itemsRef.current = localItems;
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
      const normalizedName = normalizeItemName(input.name);
      if (!normalizedName || pendingNamesRef.current.has(normalizedName)) {
        return null;
      }

      const existingItem = itemsRef.current.find(
        (item) => normalizeItemName(item.name) === normalizedName
      );
      if (existingItem) return null;

      pendingNamesRef.current.add(normalizedName);

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

      itemsRef.current = [item, ...itemsRef.current];
      updateItems(itemsRef.current);

      try {
        if (isSupabaseConfigured && supabase && user) {
          await supabase.from("shopping_list").insert(toRow(item, user.id));
        }
      } catch {
        // Local storage remains the active fallback.
      } finally {
        pendingNamesRef.current.delete(normalizedName);
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

  const updateItem = useCallback(
    async (
      id: string,
      changes: Partial<
        Pick<ShoppingListItem, "name" | "quantity" | "category" | "healthGrade">
      >
    ) => {
      const cleanChanges: Partial<
        Pick<ShoppingListItem, "name" | "quantity" | "category" | "healthGrade">
      > = {};
      if (changes.name !== undefined) cleanChanges.name = changes.name.trim();
      if (changes.quantity !== undefined) {
        cleanChanges.quantity = changes.quantity.trim() || undefined;
      }
      if (changes.category !== undefined) cleanChanges.category = changes.category;
      if (changes.healthGrade !== undefined) {
        cleanChanges.healthGrade = changes.healthGrade;
      }

      updateItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...cleanChanges } : item
        )
      );

      if (isSupabaseConfigured && supabase && user) {
        try {
          const remoteChanges: {
            name?: string;
            quantity?: string | null;
            category?: string | null;
            health_grade?: ShoppingListItem["healthGrade"] | null;
          } = {};
          if (changes.name !== undefined) remoteChanges.name = cleanChanges.name;
          if (changes.quantity !== undefined) {
            remoteChanges.quantity = cleanChanges.quantity ?? null;
          }
          if (changes.category !== undefined) {
            remoteChanges.category = cleanChanges.category ?? null;
          }
          if (changes.healthGrade !== undefined) {
            remoteChanges.health_grade = cleanChanges.healthGrade ?? null;
          }

          await supabase
            .from("shopping_list")
            .update(remoteChanges)
            .eq("id", id)
            .eq("user_id", user.id);
        } catch {
          // Local storage remains the active fallback.
        }
      }
    },
    [updateItems, user]
  );

  const restoreItems = useCallback(
    async (restoredItems: ShoppingListItem[]) => {
      if (restoredItems.length === 0) return;

      updateItems((current) => [...restoredItems, ...current]);

      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase
            .from("shopping_list")
            .upsert(restoredItems.map((item) => toRow(item, user.id)));
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
    clearChecked,
    updateItem,
    restoreItems
  };
}
