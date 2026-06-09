"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Crown,
  Lock,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  ScanBarcode,
  Search,
  ShoppingBasket,
  Trash2,
  X
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ProductSearchThumbnail } from "@/components/ProductSearchThumbnail";
import { SkarenLoader } from "@/components/SkarenLoader";
import { Spinner } from "@/components/Spinner";
import { useShoppingList } from "@/hooks/useShoppingList";
import { t, type Language } from "@/lib/i18n";
import type { KassalappSearchProduct } from "@/lib/kassalapp";
import { useLang } from "@/lib/language-context";
import { getUserPremiumStatus } from "@/lib/premium";
import { supabase } from "@/lib/supabase";
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

const quantityUnits = ["pieces", "packs", "g", "kg", "ml", "l"] as const;

function splitQuantity(value?: string) {
  const match = value?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return { amount: "", unit: "pieces" };
  const unit = quantityUnits.includes(match[2] as (typeof quantityUnits)[number])
    ? match[2]
    : "pieces";
  return { amount: match[1].replace(",", "."), unit };
}

function formatQuantity(amount: string, unit: string) {
  const cleanAmount = amount.trim();
  return cleanAmount ? `${cleanAmount} ${unit}` : "";
}

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

function inferShoppingCategory(
  product: KassalappSearchProduct
): (typeof categories)[number] {
  const text = `${product.name} ${product.brand ?? ""}`.toLocaleLowerCase("nb-NO");

  if (/(melk|milk|yogh?urt|ost|cheese|fløte|cream|smør|butter|rømme|kvarg)/.test(text)) {
    return "Dairy";
  }
  if (/(fisk|fish|laks|salmon|torsk|cod|makrell|mackerel|reke|shrimp|tunfisk|tuna)/.test(text)) {
    return "Fish";
  }
  if (/(kjøtt|meat|kylling|chicken|biff|beef|svin|pork|lam|lamb|pølse|sausage)/.test(text)) {
    return "Meat";
  }
  if (/(grønnsak|vegetable|salat|salad|tomat|tomato|potet|potato|gulrot|carrot|brokkoli|broccoli)/.test(text)) {
    return "Vegetables";
  }
  if (/(brus|soda|juice|drikk|drink|vann|water|kaffe|coffee|te\b|tea\b)/.test(text)) {
    return "Drinks";
  }
  if (/(snack|chips|sjokolade|chocolate|godteri|candy|kjeks|biscuit|cookie|nøtter|nuts)/.test(text)) {
    return "Snacks";
  }

  return "Other";
}

function ItemRow({
  item,
  expanded,
  onToggle,
  onExpand,
  onDelete,
  onEdit
}: {
  item: ShoppingListItem;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const details = [
    item.quantity ? `Quantity · ${item.quantity}` : null,
    item.healthGrade ? "Health grade" : null
  ]
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
        <div className="flex justify-end gap-1 border-t border-[var(--sk-brand-mist-dark)] bg-[var(--sk-surface-card)] px-3 py-2">
          <button
            type="button"
            onClick={onEdit}
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-[var(--sk-brand-forest)]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
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
  onSave,
  onUpdate,
  editingItem,
  lang
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: NewShoppingListItem) => Promise<ShoppingListItem | null>;
  onUpdate: (
    id: string,
    changes: Partial<Pick<ShoppingListItem, "name" | "quantity" | "category">>
  ) => Promise<void>;
  editingItem: ShoppingListItem | null;
  lang: Language;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addInFlightRef = useRef(false);
  const [name, setName] = useState("");
  const [quantityAmount, setQuantityAmount] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("pieces");
  const [category, setCategory] = useState<(typeof categories)[number]>("Other");
  const [customMode, setCustomMode] = useState(false);
  const [results, setResults] = useState<KassalappSearchProduct[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<KassalappSearchProduct | null>(null);
  const [addingProductKey, setAddingProductKey] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 120);

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setQuantityAmount("");
      setQuantityUnit("pieces");
      setCategory("Other");
      setCustomMode(false);
      setResults([]);
      setVisibleCount(8);
      setSearching(false);
      setSearchError("");
      setSelectedProduct(null);
      setAddingProductKey(null);
      setAddedMessage("");
      return;
    }

    if (editingItem) {
      const parsedQuantity = splitQuantity(editingItem.quantity);
      setName(editingItem.name);
      setQuantityAmount(parsedQuantity.amount);
      setQuantityUnit(parsedQuantity.unit);
      setCategory(
        categories.includes(
          editingItem.category as (typeof categories)[number]
        )
          ? (editingItem.category as (typeof categories)[number])
          : "Other"
      );
      setCustomMode(true);
      setResults([]);
      setSelectedProduct(null);
    }
  }, [editingItem, open]);

  useEffect(() => {
    if (!open || editingItem || customMode) return;

    const query = name.trim();

    if (query.length < 2) {
      setResults([]);
      setVisibleCount(8);
      setSearching(false);
      setSearchError("");
      setSelectedProduct(null);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      setSearchError("");

      try {
        const session = await supabase?.auth.getSession();
        const accessToken = session?.data.session?.access_token;
        if (!accessToken) throw new Error("Please log in to search products.");

        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}`,
          {
            cache: "no-store",
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal
          }
        );
        const payload = (await response.json()) as {
          products?: KassalappSearchProduct[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Product search is unavailable.");
        }

        setResults(payload.products ?? []);
        setVisibleCount(8);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setSearchError(
          error instanceof Error ? error.message : "Product search is unavailable."
        );
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [customMode, editingItem, name, open]);

  async function addProduct(product: KassalappSearchProduct) {
    if (addInFlightRef.current) return;
    addInFlightRef.current = true;

    const productKey = product.barcode ?? product.name;
    setAddingProductKey(productKey);
    setSearchError("");

    try {
      const savedItem = await onSave({
        name: product.name,
        quantity: formatQuantity(quantityAmount, quantityUnit),
        category:
          category === "Other" ? inferShoppingCategory(product) : category,
        addedFromScan: false
      });
      setAddedMessage(
        savedItem
          ? `${product.name} ${lang === 'no' ? 'ble lagt til listen.' : 'added to your list.'}`
          : `${product.name} ${t('list_already_on_list', lang)}`
      );
      setName("");
      setQuantityAmount("");
      setQuantityUnit("pieces");
      setCategory("Other");
      setResults([]);
      setVisibleCount(8);
      setSelectedProduct(null);
      onClose();
    } catch {
      setSearchError(t('list_error_add', lang));
    } finally {
      addInFlightRef.current = false;
      setAddingProductKey(null);
    }
  }

  async function saveCustomItem() {
    if (addInFlightRef.current || !name.trim()) return;
    addInFlightRef.current = true;
    setAddingProductKey("custom");
    setSearchError("");

    try {
      const changes = {
        name: name.trim(),
        quantity: formatQuantity(quantityAmount, quantityUnit),
        category
      };

      if (editingItem) {
        await onUpdate(editingItem.id, changes);
      } else {
        const savedItem = await onSave({
          ...changes,
          addedFromScan: false
        });
        if (!savedItem) {
          setSearchError(`${name.trim()} ${t('list_already_on_list', lang)}`);
          return;
        }
      }
      onClose();
    } catch {
      setSearchError(t('list_error_save', lang));
    } finally {
      addInFlightRef.current = false;
      setAddingProductKey(null);
    }
  }

  if (!open) return null;

  const searchActive =
    !customMode &&
    !editingItem &&
    (name.trim().length >= 2 || searching || results.length > 0);
  const canSaveCustom = customMode && Boolean(name.trim());

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
        className={`relative flex w-full flex-col border-t border-[var(--sk-border-default)] bg-[var(--sk-surface-white)] px-4 pt-4 shadow-[0_-20px_60px_rgba(45,40,31,0.18)] transition-[height,border-radius] ${
          searchActive
            ? "h-[100dvh] rounded-none pb-[env(safe-area-inset-bottom)]"
            : "max-h-[92vh] rounded-t-[1.75rem] pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--sk-border-default)]" />
        <div className="flex items-center justify-between">
          <div>
            <p className="type-section-label text-[var(--sk-text-faint)]">{t('list_section_label', lang)}</p>
            <h2 id="add-product-title" className="type-heading-2 mt-1 text-[var(--sk-text-primary)]">
              {editingItem ? t('list_edit_item', lang) : t('list_add_product', lang)}
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

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-3">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="type-section-label text-[var(--sk-text-muted)]">
                {customMode ? t('list_item_name', lang) : t('list_product_name', lang)}
              </span>
              {!editingItem ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomMode((current) => !current);
                    setResults([]);
                    setSelectedProduct(null);
                    setSearchError("");
                  }}
                  className="focus-ring min-h-9 rounded-full px-3 text-[11px] font-semibold text-[var(--sk-brand-forest)]"
                >
                  {customMode ? "Search products" : "Add custom item"}
                </button>
              ) : null}
            </div>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sk-text-muted)]"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSelectedProduct(null);
                  setAddedMessage("");
                }}
                placeholder={customMode ? t('list_item_name_placeholder', lang) : t('list_search_actual_products', lang)}
                autoComplete="off"
                className="focus-ring h-12 w-full rounded-xl border border-[var(--sk-border-default)] bg-white pl-12 pr-11 text-sm text-[var(--sk-text-primary)] placeholder:text-[var(--sk-text-muted)]"
              />
              {searching && !customMode ? (
                <span className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Searching products">
                  <Spinner size={20} />
                </span>
              ) : null}
            </div>

            {searchError ? (
              <p className="mt-2 text-xs text-[var(--sk-grade-e-text)]">{searchError}</p>
            ) : null}

            {addedMessage ? (
              <p
                className="mt-2 flex items-center gap-2 text-xs font-semibold text-[var(--sk-brand-forest)]"
                role="status"
                aria-live="polite"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {addedMessage}
              </p>
            ) : null}

            {!customMode &&
            !searching &&
            !searchError &&
            name.trim().length >= 2 &&
            results.length === 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--sk-border-default)] bg-[var(--sk-surface-card)] p-4 text-center">
                <p className="text-sm font-semibold text-[var(--sk-text-primary)]">
                  No matching products found
                </p>
                <p className="mt-1 text-xs text-[var(--sk-text-muted)]">
                  Try another spelling or add it as a custom item.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomMode(true);
                    setResults([]);
                    setSearchError("");
                  }}
                  className="focus-ring mt-3 min-h-10 rounded-full bg-[var(--sk-brand-forest)] px-4 text-xs font-semibold text-white"
                >
                  Add custom item
                </button>
              </div>
            ) : null}

            {!customMode && searching ? (
              <div
                className="mt-2 overflow-hidden rounded-xl border border-[var(--sk-border-default)] bg-white"
                aria-label="Loading product results"
              >
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex animate-pulse items-center gap-3 border-b border-[var(--sk-border-default)] p-3 last:border-b-0"
                  >
                    <div className="h-12 w-12 rounded-xl bg-[var(--sk-brand-mist-dark)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-[var(--sk-brand-mist-dark)]" />
                      <div className="h-2.5 w-1/3 rounded bg-[var(--sk-brand-mist)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!customMode && results.length > 0 ? (
              <div
                className="mt-2 max-h-[45dvh] overflow-y-auto rounded-xl border border-[var(--sk-border-default)] bg-white"
                role="listbox"
                aria-label="Product search results"
              >
                {results.slice(0, visibleCount).map((product, index) => {
                  const productKey = `${product.barcode ?? product.name}-${index}`;
                  const selectionKey = product.barcode ?? product.name;
                  const isSelected =
                    (selectedProduct?.barcode ?? selectedProduct?.name) ===
                    selectionKey;
                  const isAdding = addingProductKey === selectionKey;

                  return (
                  <button
                    key={productKey}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={Boolean(addingProductKey)}
                    onClick={() => {
                      setSelectedProduct(product);
                      setCategory(inferShoppingCategory(product));
                    }}
                    className={`focus-ring flex w-full items-center gap-3 border-b border-[var(--sk-border-default)] p-3 text-left last:border-b-0 ${
                      isSelected ? "bg-[var(--sk-grade-a-bg)]" : ""
                    }`}
                  >
                    <ProductSearchThumbnail
                      product={product}
                      className="h-12 w-12"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--sk-text-primary)]">
                        {product.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--sk-text-muted)]">
                        {product.brand || t('list_brand_unknown', lang)}
                      </span>
                    </span>
                    {isAdding ? (
                      <Spinner size={16} className="shrink-0" aria-label="Adding product" />
                    ) : isSelected ? (
                      <Check
                        className="h-5 w-5 shrink-0 text-[var(--sk-brand-forest)]"
                        aria-label="Selected product"
                      />
                    ) : (
                      <Plus
                        className="h-4 w-4 shrink-0 text-[var(--sk-brand-forest)]"
                        aria-label="Select product"
                      />
                    )}
                  </button>
                  );
                })}
                {visibleCount < results.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((current) =>
                        Math.min(current + 8, results.length)
                      )
                    }
                    className="focus-ring w-full px-4 py-3 text-center text-sm font-semibold text-[var(--sk-brand-forest)]"
                  >
                    Load more · {results.length - visibleCount} remaining
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <span className="type-section-label text-[var(--sk-text-muted)]">Quantity optional</span>
            <div className="mt-2 grid grid-cols-[auto_1fr_auto] overflow-hidden rounded-xl border border-[var(--sk-border-default)] bg-white">
              <button
                type="button"
                onClick={() =>
                  setQuantityAmount((current) =>
                    String(Math.max(0, Number(current || 0) - 1) || "")
                  )
                }
                className="focus-ring grid h-12 w-12 place-items-center text-[var(--sk-brand-forest)]"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                value={quantityAmount}
                onChange={(event) =>
                  setQuantityAmount(event.target.value.replace(/[^\d.,]/g, ""))
                }
                inputMode="decimal"
                placeholder="1"
                aria-label="Quantity"
                className="focus-ring h-12 min-w-0 border-x border-[var(--sk-border-default)] px-3 text-center text-sm text-[var(--sk-text-primary)]"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantityAmount((current) =>
                    String(Number(current || 0) + 1)
                  )
                }
                className="focus-ring grid h-12 w-12 place-items-center text-[var(--sk-brand-forest)]"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {quantityUnits.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setQuantityUnit(unit)}
                  className={`focus-ring min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${
                    quantityUnit === unit
                      ? "border-[var(--sk-brand-forest)] bg-[var(--sk-brand-forest)] text-white"
                      : "border-[var(--sk-border-default)] bg-white text-[var(--sk-text-secondary)]"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

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

        </div>
        <div className="sticky bottom-0 -mx-4 border-t border-[var(--sk-border-default)] bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <button
            type="button"
            disabled={
              Boolean(addingProductKey) ||
              (customMode ? !canSaveCustom : !selectedProduct)
            }
            onClick={() => {
              if (customMode) {
                void saveCustomItem();
              } else if (selectedProduct) {
                void addProduct(selectedProduct);
              }
            }}
            className="focus-ring type-button w-full rounded-2xl bg-[var(--sk-brand-forest)] px-4 py-4 text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {addingProductKey
              ? t('list_saving', lang)
              : editingItem
                ? t('list_save_changes', lang)
                : customMode
                  ? t('list_add_custom', lang)
                  : t('list_save_product', lang)}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ShoppingListPage() {
  const { lang } = useLang();
  const {
    items,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    updateItem,
    restoreItems
  } = useShoppingList();
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (!supabase) {
      setCheckingPremium(false);
      return;
    }
    getUserPremiumStatus(supabase)
      .then((premium) => setIsPremium(premium))
      .catch(() => setIsPremium(false))
      .finally(() => setCheckingPremium(false));
  }, []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [undoItems, setUndoItems] = useState<ShoppingListItem[]>([]);
  const [undoMessage, setUndoMessage] = useState("");
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

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
    const savedItem = await addItem(item);
    setActiveCategory("All");
    setSearch("");
    return savedItem;
  }

  function showUndo(message: string, removedItems: ShoppingListItem[]) {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoItems(removedItems);
    setUndoMessage(message);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoItems([]);
      setUndoMessage("");
    }, 6000);
  }

  async function removeItem(item: ShoppingListItem) {
    await deleteItem(item.id);
    setExpandedId(null);
    showUndo(`${item.name} removed`, [item]);
  }

  async function removeChecked() {
    const removedItems = items.filter((item) => item.checked);
    if (removedItems.length === 0) return;
    await clearChecked();
    showUndo(
      `${removedItems.length} completed ${
        removedItems.length === 1 ? "item" : "items"
      } cleared`,
      removedItems
    );
  }

  async function undoRemoval() {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    await restoreItems(undoItems);
    setUndoItems([]);
    setUndoMessage("");
  }

  function openEditor(item: ShoppingListItem) {
    setEditingItem(item);
    setExpandedId(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingItem(null);
  }

  if (loading || checkingPremium) return <SkarenLoader message="Loading your list" />

  if (!checkingPremium && !isPremium) {
    return (
      <>
        <BottomNav />
        <main className="min-h-screen bg-[var(--sk-brand-mist)] pb-36 flex items-start justify-center">
          <div className="mx-auto w-full max-w-sm px-4 pt-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="type-heading-1 text-[var(--sk-text-primary)]">{t('list_title', lang)}</h1>
            <p className="type-body-sm mt-3 text-[var(--sk-text-muted)] max-w-xs">
              {t('list_empty_subtitle', lang)}
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--sk-brand-forest)] px-6 font-bold text-white text-sm"
            >
              <Crown className="h-4 w-4" />
              {t('account_upgrade', lang)}
            </Link>
            <Link href="/scan" className="mt-3 text-sm text-[var(--sk-text-muted)] underline underline-offset-2">
              {t('back', lang)}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BottomNav />
      <main className="min-h-screen bg-[var(--sk-brand-mist)] pb-36 text-[var(--sk-text-primary)]">
        <div className="mx-auto w-full max-w-xl px-4 pb-8 pt-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="type-section-label text-[var(--sk-text-faint)]">{t('list_section_label', lang)}</p>
              <h1 className="type-heading-1 mt-1">{t('list_title', lang)}</h1>
              <p className="mt-1 text-[13px] text-[var(--sk-text-muted)]">
                {items.length} {items.length === 1 ? t('list_item', lang) : t('list_items', lang)}
              </p>
            </div>
            {items.length > 0 ? (
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
            ) : null}
          </header>

          {items.length > 0 && searchOpen ? (
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sk-text-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('list_search_placeholder', lang)}
                className="focus-ring h-12 w-full rounded-2xl border border-[var(--sk-border-default)] bg-white pl-11 pr-4 text-sm"
                autoFocus
              />
            </div>
          ) : null}

          {items.length > 0 ? (
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
          ) : null}

          {items.length === 0 ? (
            <section className="mt-10 flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--sk-brand-forest)] shadow-sm">
                <ShoppingBasket className="h-7 w-7" />
              </div>
              <h2 className="type-heading-3 mt-5">{t('list_empty_title', lang)}</h2>
              <p className="type-body-sm mt-2 max-w-xs text-[var(--sk-text-muted)]">
                {t('list_empty_subtitle', lang)}
              </p>
              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="focus-ring flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--sk-border-default)] bg-white px-3 text-[13px] font-bold text-[var(--sk-brand-forest)]"
                >
                  <Search className="h-5 w-5" />
                  {t('list_search_products', lang)}
                </button>
                <Link
                  href="/scan"
                  className="focus-ring flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--sk-border-default)] bg-white px-3 text-[13px] font-bold text-[var(--sk-brand-forest)]"
                >
                  <ScanBarcode className="h-5 w-5" />
                  {t('list_scan_product', lang)}
                </Link>
              </div>
              <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-[var(--sk-text-muted)]">
                {t('list_scan_grade_hint', lang)}
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
                      onDelete={() => void removeItem(item)}
                      onEdit={() => openEditor(item)}
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
                      onClick={() => void removeChecked()}
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
                        onDelete={() => void removeItem(item)}
                        onEdit={() => openEditor(item)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}

          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="focus-ring type-button mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--sk-brand-forest)] px-4 py-4 text-white"
            >
              <Plus className="h-5 w-5" />
              {t('list_add_product', lang)}
            </button>
          ) : null}
        </div>
      </main>

      <AddProductSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSave={saveItem}
        onUpdate={updateItem}
        editingItem={editingItem}
        lang={lang}
      />

      {undoItems.length > 0 ? (
        <div
          className="fixed inset-x-4 bottom-28 z-[65] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[var(--sk-text-primary)] px-4 py-3 text-white shadow-xl"
          role="status"
          aria-live="polite"
        >
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
            {undoMessage}
          </span>
          <button
            type="button"
            onClick={() => void undoRemoval()}
            className="focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[12px] font-bold text-[#d8eddc]"
          >
            <RotateCcw className="h-4 w-4" />
            Undo
          </button>
        </div>
      ) : null}
    </>
  );
}
