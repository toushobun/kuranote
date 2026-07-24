import type { BaseActionState } from "types/auth";
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
