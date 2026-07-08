"use client";

/**
 * Tiny stale-while-revalidate cache for client hooks.
 *
 * Problem it solves: hooks like useScans/useStats/useShoppingList start with
 * `loading: true` and empty data on *every* mount, so switching tabs refetches
 * from the network and flashes the full-screen SkarenLoader each time.
 *
 * With this cache, a hook can seed its initial state from the last known value
 * (instant render, no loader) and then revalidate quietly in the background.
 * Cache lives for the browser session (module scope) and is keyed per hook +
 * per user, so different accounts never bleed into each other.
 */

const store = new Map<string, unknown>();

export function getCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCache<T>(key: string, value: T): void {
  store.set(key, value);
}

export function hasCache(key: string): boolean {
  return store.has(key);
}

export function clearCache(key: string): void {
  store.delete(key);
}
