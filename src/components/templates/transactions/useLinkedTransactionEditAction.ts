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

/** runAction 由调用方的未保存守卫提供，保存与删除共用同一实例。 */
export function useLinkedTransactionEditAction(
  action: TransactionStateAction,
  runAction: <T>(action: () => Promise<T>) => Promise<T>,
) {
  const pendingConfirmationRef = useRef<FormData | null>(null);
  const [dismissedState, setDismissedState] =
    useState<TransactionActionState | null>(null);

  const actionWithConfirmation = useCallback(
    async (previousState: TransactionActionState, formData: FormData) => {
      const nextState = await runAction(() => action(previousState, formData));
      if (
        nextState.errorCode ===
        transactionErrorCodes.linkedSyncConfirmationRequired
      ) {
        pendingConfirmationRef.current = copyFormData(formData);
      }
      return nextState;
    },
    [action, runAction],
  );
  const [state, formAction, isPending] = useActionState(
    actionWithConfirmation,
    {},
  );

  const isConfirmationOpen = Boolean(
    state !== dismissedState &&
    state.error &&
    state.errorCode === transactionErrorCodes.linkedSyncConfirmationRequired,
  );
  const isFailureOpen = Boolean(
    state !== dismissedState &&
    state.error &&
    state.errorCode !== transactionErrorCodes.linkedSyncConfirmationRequired,
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
