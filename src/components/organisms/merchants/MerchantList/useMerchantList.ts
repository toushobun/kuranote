"use client";

import { useState, useTransition } from "react";
import {
  getMerchantActionErrorMessage,
  merchantErrorCodes,
} from "internal/merchant";
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
  const [order, setOrder] = useState<{
    source: Merchant[];
    merchants: Merchant[];
  } | null>(null);
  const [errorState, setErrorState] = useState<MerchantActionState>({});
  const [pending, startTransition] = useTransition();
  const orderedMerchants =
    order?.source === merchants ? order.merchants : merchants;
  const sortingDisabled = disabled || pending || !reorderAction;

  function submitOrder(ids: string[]) {
    if (sortingDisabled || !reorderAction) return;
    const previous = orderedMerchants;
    const byId = new Map(
      orderedMerchants.map((merchant) => [merchant.id, merchant]),
    );
    const formData = new FormData();
    formData.set("merchantIds", JSON.stringify(ids));
    setOrder({
      source: merchants,
      merchants: ids.flatMap((id) => byId.get(id) ?? []),
    });
    startTransition(async () => {
      try {
        const result = await reorderAction(formData);
        if (!result.error) return;
        setErrorState(result);
      } catch {
        setErrorState({
          error: getMerchantActionErrorMessage(
            merchantErrorCodes.merchantReorderFailed,
          )!,
          errorKey: crypto.randomUUID(),
        });
      }
      setOrder({ source: merchants, merchants: previous });
    });
  }

  return {
    orderedMerchants,
    disabled: sortingDisabled,
    submitOrder,
    errorState,
  };
}
