import {
  startTransition,
  useActionState,
  useCallback,
  useRef,
  useState,
} from "react";

import { transactionErrorCodes } from "internal/transaction";
import type {
  TransactionActionState,
  TransactionStateAction,
} from "types/transactions";

function copyFormData(formData: FormData) {
  const copy = new FormData();
  for (const [name, value] of formData.entries()) copy.append(name, value);
  return copy;
}

export function useLinkedTransactionEditAction(action: TransactionStateAction) {
  const pendingConfirmationRef = useRef<FormData | null>(null);
  const [dismissedState, setDismissedState] =
    useState<TransactionActionState | null>(null);

  const actionWithConfirmation = useCallback(
    async (previousState: TransactionActionState, formData: FormData) => {
      const nextState = await action(previousState, formData);
      if (
        nextState.errorKey ===
        transactionErrorCodes.linkedSyncConfirmationRequired
      ) {
        pendingConfirmationRef.current = copyFormData(formData);
      }
      return nextState;
    },
    [action],
  );
  const [state, formAction, isPending] = useActionState(
    actionWithConfirmation,
    {},
  );

  const isConfirmationOpen = Boolean(
    state !== dismissedState &&
    state.error &&
    state.errorKey === transactionErrorCodes.linkedSyncConfirmationRequired,
  );
  const isFailureOpen = Boolean(
    state !== dismissedState &&
    state.error &&
    state.errorKey !== transactionErrorCodes.linkedSyncConfirmationRequired,
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
