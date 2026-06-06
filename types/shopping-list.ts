export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  healthGrade?: "A" | "B" | "C" | "D" | "E";
  addedFromScan: boolean;
  checked: boolean;
  createdAt: string;
}

export type NewShoppingListItem = Pick<
  ShoppingListItem,
  "name" | "quantity" | "category" | "healthGrade" | "addedFromScan"
>;
