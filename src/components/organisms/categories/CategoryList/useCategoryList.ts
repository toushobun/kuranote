"use client";

import { useState, useTransition } from "react";

import { defaultCategoryEmoji } from "config/categoryEmojis";
import type {
  CategoryActionState,
  CategoryReorderAction,
  Category,
  CategoryTreeItem,
} from "types/categories";
import type { TransactionType } from "types/transactions";
import { getCategoryDisplayName } from "utils/categoryNames";

type UseCategoryListParams = {
  categories: CategoryTreeItem[];
  onReorderError: (state: CategoryActionState) => void;
  reorderCategoryAction: CategoryReorderAction;
};

type OptimisticCategoryOrder = {
  categories: CategoryTreeItem[];
  source: CategoryTreeItem[];
};

function orderItemsByIds<T extends { id: string }>(
  items: T[],
  orderedIds: string[],
) {
  const itemById = new Map(items.map((item) => [item.id, item]));

  return orderedIds.flatMap((id) => {
    const item = itemById.get(id);
    return item ? [item] : [];
  });
}

function applyCategoryOrder(
  categories: CategoryTreeItem[],
  orderedIds: string[],
  parentId: string | null,
  type: TransactionType,
) {
  if (parentId === null) {
    const orderedRoots = orderItemsByIds(
      categories.filter((category) => category.type === type),
      orderedIds,
    );
    let orderedIndex = 0;

    return categories.map((category) =>
      category.type === type
        ? (orderedRoots[orderedIndex++] ?? category)
        : category,
    );
  }

  return categories.map((category) =>
    category.id === parentId
      ? {
          ...category,
          children: orderItemsByIds(category.children, orderedIds),
        }
      : category,
  );
}

export function useCategoryList({
  categories,
  onReorderError,
  reorderCategoryAction,
}: UseCategoryListParams) {
  const [optimisticCategoryOrder, setOptimisticCategoryOrder] =
    useState<OptimisticCategoryOrder | null>(null);
  const orderedCategories =
    optimisticCategoryOrder?.source === categories
      ? optimisticCategoryOrder.categories
      : categories;
  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () =>
      new Set(
        categories
          .filter((category) => category.type === "expense")
          .slice(0, 1)
          .map((category) => category.id),
      ),
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIconName, setEditingIconName] = useState(defaultCategoryEmoji);
  const [isPending, startTransition] = useTransition();

  const visibleCategories = orderedCategories.filter(
    (category) => category.type === selectedType,
  );
  const childCount = visibleCategories.reduce(
    (count, category) => count + category.children.length,
    0,
  );

  function submitCategoryOrder(
    orderedIds: string[],
    parentId: string | null,
    type: TransactionType,
  ) {
    if (isPending) return;
    const previousCategories = orderedCategories;
    const nextCategories = applyCategoryOrder(
      previousCategories,
      orderedIds,
      parentId,
      type,
    );
    const formData = new FormData();
    formData.set("categoryIds", JSON.stringify(orderedIds));
    formData.set("parentId", parentId ?? "");
    formData.set("type", type);

    setOptimisticCategoryOrder({
      categories: nextCategories,
      source: categories,
    });
    startTransition(async () => {
      try {
        const result = await reorderCategoryAction(formData);

        if (result.error) {
          setOptimisticCategoryOrder({
            categories: previousCategories,
            source: categories,
          });
          onReorderError(result);
        }
      } catch {
        setOptimisticCategoryOrder({
          categories: previousCategories,
          source: categories,
        });
        onReorderError({
          error: "分类排序保存失败，请稍后重试。",
          errorKey: crypto.randomUUID(),
        });
      }
    });
  }

  function openEditor(category: Category) {
    setEditingCategory(category);
    setEditingName(getCategoryDisplayName(category.name, category.icon_name));
    setEditingIconName(category.icon_name ?? defaultCategoryEmoji);
  }

  function closeEditor() {
    setEditingCategory(null);
    setEditingName("");
    setEditingIconName(defaultCategoryEmoji);
  }

  function toggleCategory(categoryId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);

      return next;
    });
  }

  return {
    childCount,
    closeEditor,
    editingCategory,
    editingIconName,
    editingName,
    expandedIds,
    isPending,
    openEditor,
    selectedType,
    setEditingIconName,
    setEditingName,
    setSelectedType,
    submitCategoryOrder,
    toggleCategory,
    visibleCategories,
  };
}
