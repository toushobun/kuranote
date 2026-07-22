import type { CategoryErrorCode } from "server/category/categoryErrors";
import type { ServerAction } from "types/actions";
import type { TransactionType } from "types/transactions";

export const categoryTypeOptions = [
  { label: "支出", value: "expense" },
  { label: "收入", value: "income" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: TransactionType;
}>;

export type CategoryAction = ServerAction;

export type CategoryReorderActionResult =
  | { ok: true }
  | { error: CategoryErrorCode; ok: false };

export type CategoryReorderAction = (
  formData: FormData,
) => Promise<CategoryReorderActionResult>;

export type CategoryRow = {
  created_at: string;
  icon_name: string | null;
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  type: TransactionType;
};

export type CategoryTreeItem = CategoryRow & {
  children: CategoryRow[];
};

export type CategoryParentOption = {
  id: string;
  name: string;
  type: TransactionType;
};

export type CategoriesViewData = {
  categories: CategoryTreeItem[];
  ledgerName: string;
  parentOptions: CategoryParentOption[];
};
