export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  healthGrade?: "A" | "B" | "C" | "D" | "E";
  /** Numeric 0-100 score, shown on the list exactly like history/canvas.
      Optional so older stored items (letter only) still render. */
  healthScore?: number;
  addedFromScan: boolean;
  checked: boolean;
  createdAt: string;
}

export type NewShoppingListItem = Pick<
  ShoppingListItem,
  "name" | "quantity" | "category" | "healthGrade" | "healthScore" | "addedFromScan"
>;
