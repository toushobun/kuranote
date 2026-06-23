import type { TransactionCategoryOption } from "types/transactions";

import type { CategoryPickerGroup } from "./TransactionForm.types";

export function formatCategoryName(category: TransactionCategoryOption) {
  return category.parentName
    ? `${category.parentName} / ${category.name}`
    : category.name;
}
