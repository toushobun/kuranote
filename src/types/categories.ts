import type { BaseActionState } from "types/auth";
import type { ServerAction } from "types/actions";
import type { TransactionCategoryType } from "types/transactions";

export const categoryTypeOptions = [
  { label: "支出", value: "expense" },
  { label: "收入", value: "income" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: TransactionCategoryType;
}>;

export type CategoryAction = ServerAction;

export type CategoryActionState = BaseActionState & {
  errorKey?: string;
};

export type CategoryStateAction = (
  previousState: CategoryActionState,
  formData: FormData,
) => Promise<CategoryActionState>;

export type CategoryReorderAction = (
  formData: FormData,
) => Promise<CategoryActionState>;

export type Category = {
  created_at: string;
  icon_name: string | null;
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  type: TransactionCategoryType;
};

export type CategoryTreeItem = Category & {
  children: Category[];
};

export type CategoryParentOption = {
  id: string;
  name: string;
  type: TransactionCategoryType;
};

export type CategoriesViewData = {
  categories: CategoryTreeItem[];
  ledgerName: string;
  parentOptions: CategoryParentOption[];
};
