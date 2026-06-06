"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Plus,
  Search,
  ShoppingBasket,
  Trash2,
  X
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useShoppingList } from "@/hooks/useShoppingList";
import type {
  NewShoppingListItem,
  ShoppingListItem
} from "@/types/shopping-list";

const categories = [
  "Dairy",
  "Meat",
  "Fish",
  "Vegetables",
  "Snacks",
  "Drinks",
  "Other"
] as const;

const gradeStyles: Record<
  NonNullable<ShoppingListItem["healthGrade"]>,
  string
> = {
  A: "bg-[var(--sk-grade-a-bg)] text-[var(--sk-brand-forest)]",
  B: "bg-[var(--sk-grade-b-bg)] text-[var(--sk-brand-leaf)]",
  C: "bg-[var(--sk-grade-c-bg)] text-[var(--sk-grade-c-text)]",
  D: "bg-[var(--sk-grade-d-bg)] text-[var(--sk-grade-d-text)]",
  E: "bg-[var(--sk-grade-e-bg)] text-[var(--sk-grade-e-text)]"
};

function ItemRow({
  item,
  expanded,
  onToggle,
  onExpand,
  onDelete
}: {
  item: ShoppingListItem;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onDelete: () => void;
}) {
  const details = [item.quantity, item.healthGrade ? "Health grade" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--sk-border-default)] bg-white">
      <div
        className={`flex min-h-[4.6rem] items-center gap-3 px-4 py-3 transition ${
          item.checked ? "text-[var(--sk-text-muted)]" : "text-[var(--sk-text-primary)]"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            item.checked
              ? `Mark ${item.name} as not done`
              : `Mark ${item.name} as done`
          }
          className={`focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
            item.checked
              ? "border-[var(--sk-brand-forest)] bg-[var(--sk-brand-forest)] text-white"
              : "border-[var(--sk-border-default)] bg-white text-transparent"
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onExpand}
          className="focus-ring flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-[13px] font-bold ${
                item.checked ? "line-through" : ""
              }`}
            >
              {item.name}
            </span>
            {details ? (
              <span className="mt-1 block text-[11px] text-[var(--sk-text-muted)]">
                {details}
              </span>
            ) : null}
          </span>

          {item.healthGrade ? (
            <span
              className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-[11px] font-bold ${gradeStyles[item.healthGrade]}`}
              aria-label={`Health grade ${item.healthGrade}`}
            >
              {item.healthGrade}
            </span>
          ) : null}

          <ChevronRight
            className={`h-4 w-4 shrink-0 text-[var(--sk-text-faint)] transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {expanded ? (
        <div className="flex justify-end border-t border-[var(--sk-brand-mist-dark)] bg-[var(--sk-surface-card)] px-3 py-2">
          <button
            type="button"
            onClick={onDelete}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[var(--sk-grade-e-text)]"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddProductSheet({
  open,
  onClose,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: NewShoppingListItem) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Other");

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 120);

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  async function saveItem() {
    if (!name.trim()) {
      inputRef.current?.focus();
      return;
    }

    await onSave({
      name,
      quantity,
      category,
      addedFromScan: false
    });
    setName("");
    setQuantity("");
    setCategory("Other");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--sk-text-primary)]/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close add product"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        className="relative w-full rounded-t-[1.75rem] border-t border-[var(--sk-border-default)] bg-[var(--sk-surface-white)] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-20px_60px_rgba(45,40,31,0.18)]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--sk-border-default)]" />
        <div className="flex items-center justify-between">
          <div>
            <p className="type-section-label text-[var(--sk-text-faint)]">Shopping list</p>
            <h2 id="add-product-title" className="type-heading-2 mt-1 text-[var(--sk-text-primary)]">
              Add product
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-[var(--sk-brand-mist)] text-[var(--sk-text-secondary)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="type-section-label text-[var(--sk-text-muted)]">Product name</span>
            <input
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What do you need?"
              className="focus-ring mt-2 h-12 w-full rounded-xl border border-[var(--sk-border-default)] bg-white px-4 text-sm text-[var(--sk-text-primary)] placeholder:text-[var(--sk-text-muted)]"
            />
          </label>

          <label className="block">
            <span className="type-section-label text-[var(--sk-text-muted)]">Quantity optional</span>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="e.g. 2 packs"
              className="focus-ring mt-2 h-12 w-full rounded-xl border border-[var(--sk-border-default)] bg-white px-4 text-sm text-[var(--sk-text-primary)] placeholder:text-[var(--sk-text-muted)]"
            />
          </label>

          <div>
            <p className="type-section-label text-[var(--sk-text-muted)]">Category</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`focus-ring min-h-10 rounded-full border px-3 text-xs font-semibold transition ${
                    category === option
                      ? "border-[var(--sk-brand-forest)] bg-[var(--sk-brand-forest)] text-white"
                      : "border-[var(--sk-border-default)] bg-white text-[var(--sk-text-secondary)]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void saveItem()}
            className="focus-ring type-button w-full rounded-2xl bg-[var(--sk-brand-forest)] px-4 py-4 text-white"
          >
            Save product
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ShoppingListPage() {
  const { items, loading, addItem, toggleItem, deleteItem, clearChecked } =
    useShoppingList();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.category).filter(Boolean) as string[])
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const categoryMatches =
        activeCategory === "All" || item.category === activeCategory;
      const searchMatches =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);
      return categoryMatches && searchMatches;
    });
  }, [activeCategory, items, search]);

  const toBuy = filteredItems.filter((item) => !item.checked);
  const done = filteredItems.filter((item) => item.checked);

  async function saveItem(item: NewShoppingListItem) {
    await addItem(item);
    setActiveCategory("All");
    setSearch("");
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-[var(--sk-brand-mist)] pb-36 text-[var(--sk-text-primary)]">
        <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="type-section-label text-[var(--sk-text-faint)]">Shopping list</p>
              <h1 className="type-heading-1 mt-1">My list</h1>
              <p className="mt-1 text-[13px] text-[var(--sk-text-muted)]">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-[var(--sk-border-default)] bg-white text-[var(--sk-brand-forest)]"
                aria-label="Search shopping list"
                aria-expanded={searchOpen}
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-[var(--sk-brand-forest)] text-white"
                aria-label="Add product"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </header>

          {searchOpen ? (
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sk-text-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search or add a product"
                className="focus-ring h-12 w-full rounded-2xl border border-[var(--sk-border-default)] bg-white pl-11 pr-12 text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="focus-ring absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-xl text-[var(--sk-brand-forest)]"
                aria-label="Add a new product"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          ) : null}

          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-1"
            aria-label="Filter shopping list by category"
          >
            {["All", ...availableCategories].map((category) => {
              const count =
                category === "All"
                  ? items.length
                  : items.filter((item) => item.category === category).length;
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`focus-ring min-h-10 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
                    active
                      ? "border-[var(--sk-brand-forest)] bg-[var(--sk-brand-forest)] text-white"
                      : "border-[var(--sk-border-default)] bg-[var(--sk-surface-white)] text-[var(--sk-text-secondary)]"
                  }`}
                >
                  {category} · {count}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="mt-6 space-y-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[4.6rem] animate-pulse rounded-2xl border border-[var(--sk-border-default)] bg-white/70"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <section className="mt-10 flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--sk-brand-forest)] shadow-sm">
                <ShoppingBasket className="h-7 w-7" />
              </div>
              <h2 className="type-heading-3 mt-5">Your list is ready</h2>
              <p className="type-body-sm mt-2 max-w-xs text-[var(--sk-text-muted)]">
                Add groceries here or save a product after scanning it.
              </p>
            </section>
          ) : (
            <div className="mt-7 space-y-8">
              <section>
                <p className="type-section-label text-[var(--sk-text-faint)]">
                  To buy · {toBuy.length}
                </p>
                <div className="mt-3 space-y-2">
                  {toBuy.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      expanded={expandedId === item.id}
                      onToggle={() => void toggleItem(item.id)}
                      onExpand={() =>
                        setExpandedId((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                      onDelete={() => void deleteItem(item.id)}
                    />
                  ))}
                </div>
              </section>

              {done.length > 0 ? (
                <section>
                  <div className="flex items-center justify-between">
                    <p className="type-section-label text-[var(--sk-text-faint)]">
                      Done · {done.length}
                    </p>
                    <button
                      type="button"
                      onClick={() => void clearChecked()}
                      className="focus-ring min-h-10 rounded-full px-3 text-[11px] font-semibold text-[var(--sk-text-secondary)]"
                    >
                      Clear done
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {done.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        expanded={expandedId === item.id}
                        onToggle={() => void toggleItem(item.id)}
                        onExpand={() =>
                          setExpandedId((current) =>
                            current === item.id ? null : item.id
                          )
                        }
                        onDelete={() => void deleteItem(item.id)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="focus-ring type-button mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--sk-brand-forest)] px-4 py-4 text-white"
          >
            <Plus className="h-5 w-5" />
            Add product
          </button>
        </div>
      </main>

      <AddProductSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={saveItem}
      />
    </>
  );
}
