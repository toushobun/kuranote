"use client";

import { useState } from "react";

import {
  orderItemsByIds,
  useOptimisticReorder,
} from "molecules/ui/SortableList/useOptimisticReorder";
import { defaultCategoryEmoji } from "config/categoryEmojis";
import { categoryEditMessages } from "config/categoryMessages";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
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
  const confirm = useConfirmDialog();
  const {
    orderedItems: orderedCategories,
    isPending,
    submitOrder: reorder,
  } = useOptimisticReorder({
    items: categories,
    action: reorderCategoryAction,
    onError: onReorderError,
    fallbackMessage: "分类排序保存失败，请稍后重试。",
  });
  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIconName, setEditingIconName] = useState(defaultCategoryEmoji);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const keyword = searchQuery.trim().toLowerCase();
  const isSearching = keyword.length > 0;
  const renderedExpandedIds = new Set(expandedIds);
  const forcedExpandedIds = new Set<string>();
  const matchesName = (category: Category) =>
    getCategoryDisplayName(category.name, category.icon_name)
      .toLowerCase()
      .includes(keyword);
  const visibleCategories = orderedCategories
    .filter((category) => category.type === selectedType)
    .flatMap((category) => {
      if (!isSearching) return [category];
      const children = category.children.filter(matchesName);
      if (children.length > 0) {
        forcedExpandedIds.add(category.id);
        renderedExpandedIds.add(category.id);
      }
      if (matchesName(category)) return [category];
      return children.length > 0 ? [{ ...category, children }] : [];
    });

  function submitCategoryOrder(
    orderedIds: string[],
    parentId: string | null,
    type: TransactionType,
  ) {
    if (isPending || isSearching) return;
    const formData = new FormData();
    formData.set("categoryIds", JSON.stringify(orderedIds));
    formData.set("parentId", parentId ?? "");
    formData.set("type", type);

    reorder(formData, (items) =>
      applyCategoryOrder(items, orderedIds, parentId, type),
    );
  }

  function openEditor(category: Category) {
    setEditingCategory(category);
    setEditingName(getCategoryDisplayName(category.name, category.icon_name));
    setEditingIconName(category.icon_name ?? defaultCategoryEmoji);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  async function requestCloseEditor() {
    const originalName = editingCategory
      ? getCategoryDisplayName(editingCategory.name, editingCategory.icon_name)
      : "";
    const originalIconName = editingCategory?.icon_name ?? defaultCategoryEmoji;
    const hasUnsavedChanges =
      editingCategory !== null &&
      (editingName !== originalName || editingIconName !== originalIconName);

    if (!hasUnsavedChanges) {
      closeEditor();
      return;
    }

    const ok = await confirm({
      cancelLabel: categoryEditMessages.continueEditing,
      confirmColor: "error",
      confirmLabel: categoryEditMessages.discardChanges,
      description: categoryEditMessages.unsavedDescription,
      title: categoryEditMessages.unsavedTitle,
    });

    if (ok) closeEditor();
  }

  function resetEditor() {
    setEditingCategory(null);
    setEditingName("");
    setEditingIconName(defaultCategoryEmoji);
  }

  function toggleCategory(categoryId: string) {
    if (forcedExpandedIds.has(categoryId)) return;
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);

      return next;
    });
  }

  return {
    closeEditor,
    editingCategory,
    editingIconName,
    editingName,
    expandedIds,
    renderedExpandedIds,
    forcedExpandedIds,
    isEditorOpen,
    isSearching,
    searchQuery,
    setSearchQuery,
    isPending,
    openEditor,
    requestCloseEditor,
    resetEditor,
    selectedType,
    setEditingIconName,
    setEditingName,
    setSelectedType,
    submitCategoryOrder,
    toggleCategory,
    visibleCategories,
  };
}
