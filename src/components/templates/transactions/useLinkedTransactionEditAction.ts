import {
  startTransition,
  useActionState,
  useCallback,
  useRef,
  useState,
} from "react";

import { linkedTransactionSyncMessages as m } from "config/transactionStepFlowMessages";
import { formatUnsignedCurrencyAmount } from "utils/transactions";
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

export type OriginalLinkedTarget = {
  currency: string;
  incomeItemId: string;
  kind: "refund" | "reimbursement";
  label: string;
  targetItemId: string;
  surplus: string;
};

function describeLinkRetarget(
  formData: FormData | null,
  originals: OriginalLinkedTarget[],
) {
  if (!formData || originals.length === 0) return null;
  const itemIds = formData.getAll("itemPersistedId").map(String);
  const refundedItemIds = formData.getAll("itemRefundedItemId").map(String);
  const reimbursementItemIds = formData
    .getAll("itemReimbursementItemId")
    .map(String);
  const refundLabels = formData.getAll("itemRefundedItemLabel").map(String);
  const reimbursementLabels = formData
    .getAll("itemReimbursementItemLabel")
    .map(String);

  const surplusAmounts = formData.getAll("itemLinkedIncomeSurplus").map(String);

  const changes = originals.flatMap((original) => {
    const index = itemIds.indexOf(original.incomeItemId);
    if (index < 0) return [];
    const isRefund = original.kind === "refund";
    const targetId = (isRefund ? refundedItemIds : reimbursementItemIds)[index];
    if (!targetId || targetId === original.targetItemId) return [];
    const label =
      (isRefund ? refundLabels : reimbursementLabels)[index] ||
      m.fallbackTarget;
    const target = m.retarget(
      original.kind,
      `${original.label}（${original.targetItemId.slice(0, 8)}）`,
      `${label}（${targetId.slice(0, 8)}）`,
    );
    const surplus = surplusAmounts[index];
    if (!surplus || Number(surplus) === Number(original.surplus))
      return [target];
    return [
      `${target}，${m.surplusChange(
        formatUnsignedCurrencyAmount(original.surplus, original.currency),
        formatUnsignedCurrencyAmount(surplus, original.currency),
      )}`,
    ];
  });
  return changes.length > 0
    ? `${changes.join("；")}。${m.retargetDetails}`
    : null;
}

export function useLinkedTransactionEditAction(
  action: TransactionStateAction,
  runSaveAction: ReturnType<typeof useUnsavedChangesGuard>["runSaveAction"],
  initialLinkedTargets: OriginalLinkedTarget[] = [],
) {
  const pendingConfirmationRef = useRef<FormData | null>(null);
  const [retargetDescription, setRetargetDescription] = useState<string | null>(
    null,
  );
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
        setRetargetDescription(
          describeLinkRetarget(formData, initialLinkedTargets),
        );
      }
      return nextState;
    },
    [action, runSaveAction, initialLinkedTargets],
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
    setRetargetDescription(null);
    setDismissedState(state);
  }

  function confirmSync() {
    const formData = pendingConfirmationRef.current;
    if (!formData) return;

    formData.set("confirmSync", "true");
    pendingConfirmationRef.current = null;
    setRetargetDescription(null);
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
    retargetDescription,
    state,
  };
}
