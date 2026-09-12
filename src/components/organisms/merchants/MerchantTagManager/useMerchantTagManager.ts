"use client";

import {
  orderItemsByIds,
  useOptimisticReorder,
} from "molecules/ui/SortableList/useOptimisticReorder";

import { merchantText } from "config/merchantText";
import type {
  MerchantTag,
  MerchantTagActionState,
  MerchantTagReorderAction,
} from "types/merchants";

type UseMerchantTagManagerParams = {
  onReorderError: (state: MerchantTagActionState) => void;
  reorderAction: MerchantTagReorderAction;
  tags: MerchantTag[];
};

export function useMerchantTagManager({
  onReorderError,
  reorderAction,
  tags,
}: UseMerchantTagManagerParams) {
  const {
    orderedItems: orderedTags,
    isPending,
    submitOrder: reorder,
  } = useOptimisticReorder({
    items: tags,
    action: reorderAction,
    onError: onReorderError,
    fallbackMessage: merchantText.categoryReorderFallback,
  });

  function submitOrder(ids: string[]) {
    if (isPending) return;
    const formData = new FormData();
    formData.set("tagIds", JSON.stringify(ids));
    reorder(formData, (items) => orderItemsByIds(items, ids));
  }

  return { isPending, orderedTags, submitOrder };
}
