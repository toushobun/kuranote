"use client";

import { useCallback, useRef, useState } from "react";

import type { MerchantActionState, MerchantStateAction } from "types/merchants";

const initialMerchantActionState: MerchantActionState = {};
const unknownMerchantScope = "__unknown_merchant__";

export function useMerchantDisplayNameListAction(action: MerchantStateAction) {
  const pendingMerchantIdsRef = useRef(new Set<string>());
  const latestSubmissionIdRef = useRef(0);
  const [pendingMerchantIds, setPendingMerchantIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [state, setState] = useState<MerchantActionState>(
    initialMerchantActionState,
  );

  const submitAction = useCallback(
    async (formData: FormData) => {
      const merchantIdValue = formData.get("merchantId");
      const merchantScope =
        typeof merchantIdValue === "string" && merchantIdValue.length > 0
          ? merchantIdValue
          : unknownMerchantScope;

      if (pendingMerchantIdsRef.current.has(merchantScope)) return;

      const submissionId = latestSubmissionIdRef.current + 1;
      latestSubmissionIdRef.current = submissionId;
      pendingMerchantIdsRef.current.add(merchantScope);
      setPendingMerchantIds(new Set(pendingMerchantIdsRef.current));
      setState({});

      try {
        const nextState = await action(initialMerchantActionState, formData);
        if (latestSubmissionIdRef.current === submissionId) {
          setState(nextState);
        }
      } finally {
        pendingMerchantIdsRef.current.delete(merchantScope);
        setPendingMerchantIds(new Set(pendingMerchantIdsRef.current));
      }
    },
    [action],
  );

  return {
    action: submitAction,
    pendingMerchantIds,
    state,
  };
}
