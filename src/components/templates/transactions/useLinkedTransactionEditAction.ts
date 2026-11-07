import {
  startTransition,
  useActionState,
  useCallback,
  useRef,
  useState,
} from "react";

import { transactionErrorCodes } from "internal/transaction";
import type { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import type {
  TransactionActionState,
  TransactionStateAction,
} from "types/transactions";

function copyFormData(formData: FormData) {
  const copy = new FormData();
  for (const [name, value] of formData.entries()) copy.append(name, value);
  return copy;
}

function requiresSyncConfirmation(state: TransactionActionState) {
  return (
    state.errorCode === transactionErrorCodes.linkedSyncConfirmationRequired
  );
}

export function useLinkedTransactionEditAction(
  action: TransactionStateAction,
  runSaveAction: ReturnType<typeof useUnsavedChangesGuard>["runSaveAction"],
) {
  const pendingConfirmationRef = useRef<FormData | null>(null);
  const [dismissedState, setDismissedState] =
    useState<TransactionActionState | null>(null);

  const actionWithConfirmation = useCallback(
    async (previousState: TransactionActionState, formData: FormData) => {
      const nextState = await runSaveAction(
        formData,
        (data) => action(previousState, data),
        requiresSyncConfirmation,
      );
      if (requiresSyncConfirmation(nextState)) {
        pendingConfirmationRef.current = copyFormData(formData);
      }
      return nextState;
    },
    [action, runSaveAction],
  );
  const [state, formAction, isPending] = useActionState(
    actionWithConfirmation,
    {},
  );

  const isConfirmationOpen = Boolean(
    state !== dismissedState && state.error && requiresSyncConfirmation(state),
  );
  const isFailureOpen = Boolean(
    state !== dismissedState && state.error && !requiresSyncConfirmation(state),
  );

  function cancelConfirmation() {
    pendingConfirmationRef.current = null;
    setDismissedState(state);
  }

  function confirmSync() {
    const formData = pendingConfirmationRef.current;
    if (!formData) return;

    formData.set("confirmSync", "true");
    pendingConfirmationRef.current = null;
    setDismissedState(state);
    startTransition(() => formAction(formData));
  }

  return {
    cancelConfirmation,
    closeFailure: () => setDismissedState(state),
    confirmSync,
    formAction,
    isConfirmationOpen,
    isFailureOpen,
    isPending,
    state,
  };
}
