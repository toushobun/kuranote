"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { MerchantActionState, MerchantStateAction } from "types/merchants";

type MerchantActionOperation =
  | "archive"
  | "archiveAlias"
  | "create"
  | "createAlias"
  | "update";

type UseMerchantsActionStateOptions = {
  merchantId?: string;
  operation: MerchantActionOperation;
  resetOnSuccess?: boolean;
};

type TrackedMerchantActionState = {
  actionState: MerchantActionState;
  completedSubmissionToken?: string;
};

const submissionTokenField = "__merchantSubmissionToken";
const initialMerchantActionState: MerchantActionState = {};
const initialTrackedActionState: TrackedMerchantActionState = {
  actionState: initialMerchantActionState,
};

export function useMerchantsActionState(
  action: MerchantStateAction,
  {
    merchantId,
    operation,
    resetOnSuccess = false,
  }: UseMerchantsActionStateOptions,
) {
  const trackedAction = useCallback(
    async (
      previousState: TrackedMerchantActionState,
      formData: FormData,
    ): Promise<TrackedMerchantActionState> => {
      const submissionToken = formData.get(submissionTokenField);
      formData.delete(submissionTokenField);
      const actionState = await action(previousState.actionState, formData);

      return {
        actionState,
        completedSubmissionToken:
          typeof submissionToken === "string" ? submissionToken : undefined,
      };
    },
    [action],
  );
  const [trackedState, dispatchAction, isActionPending] = useActionState(
    trackedAction,
    initialTrackedActionState,
  );
  const actionScope = merchantId ? `${operation}:${merchantId}` : operation;
  const inFlightTokenRef = useRef<string | null>(null);
  const observedPendingRef = useRef(false);
  const [actionState, setActionState] = useState(initialMerchantActionState);
  const [resetKey, setResetKey] = useState(`${actionScope}:initial`);
  const [submissionPending, setSubmissionPending] = useState(false);

  useEffect(() => {
    if (isActionPending) {
      observedPendingRef.current = true;
      return;
    }

    const inFlightToken = inFlightTokenRef.current;
    if (!inFlightToken) return;

    const actionReturned =
      trackedState.completedSubmissionToken === inFlightToken;
    if (!actionReturned && !observedPendingRef.current) return;

    inFlightTokenRef.current = null;
    observedPendingRef.current = false;
    setSubmissionPending(false);

    if (actionReturned && trackedState.actionState.error) {
      setActionState(trackedState.actionState);
      return;
    }

    setActionState({});
    if (resetOnSuccess) setResetKey(inFlightToken);
  }, [isActionPending, resetOnSuccess, trackedState]);

  const submitAction = useCallback(
    (formData: FormData) => {
      if (inFlightTokenRef.current) return;

      const submissionToken = `${actionScope}:${crypto.randomUUID()}`;
      inFlightTokenRef.current = submissionToken;
      observedPendingRef.current = false;
      setSubmissionPending(true);
      setActionState({});
      formData.set(submissionTokenField, submissionToken);
      dispatchAction(formData);
    },
    [actionScope, dispatchAction],
  );

  return {
    action: submitAction,
    pending: isActionPending || submissionPending,
    resetKey,
    state: actionState,
  };
}
