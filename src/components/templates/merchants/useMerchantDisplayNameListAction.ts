"use client";

import { useCallback, useRef, useState } from "react";

import type { MerchantActionState, MerchantStateAction } from "types/merchants";

const initialMerchantActionState: MerchantActionState = {};
const unknownMerchantScope = "__unknown_merchant__";

export function useMerchantDisplayNameListAction(action: MerchantStateAction) {
  const inFlightMerchantIdsRef = useRef(new Set<string>());
  const latestSubmissionIdRef = useRef(0);
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

      if (inFlightMerchantIdsRef.current.has(merchantScope)) return;

      const submissionId = latestSubmissionIdRef.current + 1;
      latestSubmissionIdRef.current = submissionId;
      inFlightMerchantIdsRef.current.add(merchantScope);
      setState({});

      try {
        const nextState = await action(initialMerchantActionState, formData);
        if (latestSubmissionIdRef.current === submissionId) {
          setState(nextState);
        }
      } finally {
        inFlightMerchantIdsRef.current.delete(merchantScope);
      }
    },
    [action],
  );

  return {
    action: submitAction,
    state,
  };
}
