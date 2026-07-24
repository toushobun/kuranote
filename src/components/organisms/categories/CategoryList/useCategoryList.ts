"use client";

import { useRef, useState, useTransition, type PointerEvent } from "react";

import { defaultCategoryEmoji } from "config/categoryEmojis";
import type {
  CategoryReorderAction,
  CategoryRow,
  CategoryTreeItem,
} from "types/categories";
import type { TransactionType } from "types/transactions";
import { getCategoryDisplayName } from "utils/categoryNames";
import { getCategoryErrorMessage } from "utils/pageErrors";

type DraggedCategory = Pick<CategoryRow, "id" | "parent_id" | "type">;

type UseCategoryListParams = {
  categories: CategoryTreeItem[];
  reorderCategoryAction: CategoryReorderAction;
};

type OptimisticCategoryOrder = {
  categories: CategoryTreeItem[];
  source: CategoryTreeItem[];
};

export type CategoryMoveDirection = -1 | 1;

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
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");
  const [editingIconName, setEditingIconName] = useState(defaultCategoryEmoji);
  const draggedCategoryRef = useRef<DraggedCategory | null>(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(
    null,
  );
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleCategories = orderedCategories.filter(
    (category) => category.type === selectedType,
  );
  const childCount = visibleCategories.reduce(
    (count, category) => count + category.children.length,
    0,
  );

  function getSiblings(category: Pick<CategoryRow, "parent_id" | "type">) {
    return category.parent_id === null
      ? orderedCategories.filter(
          (candidate) =>
            candidate.type === category.type && candidate.parent_id === null,
        )
      : (orderedCategories.find((parent) => parent.id === category.parent_id)
          ?.children ?? []);
  }

  function submitCategoryOrder(
    orderedIds: string[],
    parentId: string | null,
    type: TransactionType,
  ) {
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
    setReorderError(null);

    startTransition(async () => {
      try {
        const result = await reorderCategoryAction(formData);

        if (!result.ok) {
          setOptimisticCategoryOrder({
            categories: previousCategories,
            source: categories,
          });
          setReorderError(
            getCategoryErrorMessage(result.error) ??
              "分类排序保存失败，请稍后重试。",
          );
        }
      } catch {
        setOptimisticCategoryOrder({
          categories: previousCategories,
          source: categories,
        });
        setReorderError("分类排序保存失败，请稍后重试。");
      }
    });
  }

  function openEditor(category: CategoryRow) {
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

  function startDrag(
    event: PointerEvent<HTMLButtonElement>,
    category: CategoryRow,
  ) {
    if (event.button !== 0 || isPending) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    draggedCategoryRef.current = {
      id: category.id,
      parent_id: category.parent_id,
      type: category.type,
    };
    setDraggedCategoryId(category.id);
  }

  function cancelDrag() {
    draggedCategoryRef.current = null;
    setDraggedCategoryId(null);
  }

  function finishDrag(
    event: PointerEvent<HTMLButtonElement>,
    sourceCategory: CategoryRow,
  ) {
    const draggedCategory = draggedCategoryRef.current;
    const targetElement = document
      .elementFromPoint?.(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-category-row-id]");
    const targetId = targetElement?.dataset.categoryRowId;
    const allCategories = orderedCategories.flatMap((category) => [
      category,
      ...category.children,
    ]);
    const targetCategory = allCategories.find(
      (category) => category.id === targetId,
    );

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    if (
      !draggedCategory ||
      draggedCategory.id !== sourceCategory.id ||
      !targetElement ||
      !targetCategory ||
      draggedCategory.id === targetCategory.id ||
      draggedCategory.type !== targetCategory.type ||
      draggedCategory.parent_id !== targetCategory.parent_id
    ) {
      cancelDrag();
      return;
    }

    const orderedIds = getSiblings(targetCategory).map(
      (category) => category.id,
    );
    const draggedIndex = orderedIds.indexOf(draggedCategory.id);
    const targetIndex = orderedIds.indexOf(targetCategory.id);

    if (draggedIndex < 0 || targetIndex < 0) {
      cancelDrag();
      return;
    }

    orderedIds.splice(draggedIndex, 1);
    const targetRect = targetElement.getBoundingClientRect();
    const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
    let insertIndex = orderedIds.indexOf(targetCategory.id);

    if (insertAfter) insertIndex += 1;
    orderedIds.splice(insertIndex, 0, draggedCategory.id);

    submitCategoryOrder(
      orderedIds,
      targetCategory.parent_id,
      targetCategory.type,
    );
    cancelDrag();
  }

  function moveCategory(
    category: CategoryRow,
    direction: CategoryMoveDirection,
  ) {
    if (isPending) return;

    const orderedIds = getSiblings(category).map((sibling) => sibling.id);
    const currentIndex = orderedIds.indexOf(category.id);
    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= orderedIds.length
    ) {
      return;
    }

    const [categoryId] = orderedIds.splice(currentIndex, 1);
    orderedIds.splice(targetIndex, 0, categoryId);
    submitCategoryOrder(orderedIds, category.parent_id, category.type);
  }

  return {
    cancelDrag,
    childCount,
    closeEditor,
    draggedCategoryId,
    editingCategory,
    editingIconName,
    editingName,
    expandedIds,
    finishDrag,
    isPending,
    moveCategory,
    openEditor,
    reorderError,
    selectedType,
    setEditingIconName,
    setEditingName,
    setSelectedType,
    startDrag,
    toggleCategory,
    visibleCategories,
  };
}
