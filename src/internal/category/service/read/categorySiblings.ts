import type { CategorySibling } from "internal/category/repository/categoryRepository";
import { getCategoryDisplayName } from "utils/categoryNames";

function normalizeCategoryDisplayName(name: string, iconName?: string | null) {
  return getCategoryDisplayName(name, iconName).trim().toLowerCase();
}

export function hasDuplicateCategoryName(
  siblings: CategorySibling[],
  name: string,
  excludeCategoryId?: string,
) {
  const normalizedName = normalizeCategoryDisplayName(name);

  return siblings.some(
    (category) =>
      category.id !== excludeCategoryId &&
      normalizeCategoryDisplayName(category.name, category.iconName) ===
        normalizedName,
  );
}

export function getNextCategorySortOrder(siblings: CategorySibling[]) {
  const maxSortOrder = Math.max(
    0,
    ...siblings.map((category) =>
      Number.isFinite(category.sortOrder) ? category.sortOrder : 0,
    ),
  );
  return maxSortOrder + 10;
}
