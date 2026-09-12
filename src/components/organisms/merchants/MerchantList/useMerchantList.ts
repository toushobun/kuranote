"use client";

import { useState } from "react";
import {
  getMerchantActionErrorMessage,
  merchantErrorCodes,
} from "internal/merchant";
import {
  orderItemsByIds,
  useOptimisticReorder,
} from "molecules/ui/SortableList/useOptimisticReorder";
import type {
  Merchant,
  MerchantActionState,
  MerchantReorderAction,
} from "types/merchants";

export function useMerchantList({
  merchants,
  reorderAction,
  disabled,
}: {
  merchants: Merchant[];
  reorderAction?: MerchantReorderAction;
  disabled: boolean;
}) {
  const [errorState, setErrorState] = useState<MerchantActionState>({});
  const reorder = useOptimisticReorder({
    items: merchants,
    action: async (formData) => (reorderAction ? reorderAction(formData) : {}),
    onError: setErrorState,
    fallbackMessage: getMerchantActionErrorMessage(
      merchantErrorCodes.merchantReorderFailed,
    )!,
  });
  const sortingDisabled = disabled || reorder.isPending || !reorderAction;

  function submitOrder(ids: string[]) {
    if (sortingDisabled || !reorderAction) return;
    const formData = new FormData();
    formData.set("merchantIds", JSON.stringify(ids));
    reorder.submitOrder(formData, (items) => orderItemsByIds(items, ids));
  }

  return {
    orderedMerchants: reorder.orderedItems,
    disabled: sortingDisabled,
    submitOrder,
    errorState,
  };
}
