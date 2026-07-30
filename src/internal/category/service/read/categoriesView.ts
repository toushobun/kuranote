import { canManageMasterData } from "internal/ledger";
import type { CurrentLedgerRole } from "internal/ledger";
import type { CategoryRow, CategoryTreeItem } from "types/categories";

function buildCategoryTree(categories: CategoryRow[]): CategoryTreeItem[] {
  const roots: CategoryTreeItem[] = categories
    .filter((category) => category.parent_id === null)
    .map((category) => ({ ...category, children: [] }));
  const rootById = new Map(roots.map((category) => [category.id, category]));

  for (const category of categories) {
    if (category.parent_id === null) continue;
    rootById.get(category.parent_id)?.children.push(category);
  }

  return roots;
}

export function buildCategoriesView({
  categories,
  ledgerName,
  role,
}: {
  categories: CategoryRow[];
  ledgerName: string;
  role: CurrentLedgerRole;
}) {
  const roots = buildCategoryTree(categories);

  return {
    canManageCategories: canManageMasterData(role),
    categories: roots,
    ledgerName,
    parentOptions: roots.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
  };
}
