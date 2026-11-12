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

export type OriginalLinkedTarget = {
  incomeItemId: string;
  kind: "refund" | "reimbursement";
  label: string;
  targetItemId: string;
};

function describeLinkRetarget(
  formData: FormData | null,
  originals: OriginalLinkedTarget[],
) {
  if (!formData || originals.length === 0) return null;
  const itemIds = formData.getAll("itemPersistedId").map(String);
  const refundedItemIds = formData.getAll("itemRefundedItemId").map(String);
  const reimbursementItemIds = formData.getAll("itemReimbursementItemId").map(String);
  const refundLabels = formData.getAll("itemRefundedItemLabel").map(String);
  const reimbursementLabels = formData.getAll("itemReimbursementItemLabel").map(String);

  const changes = originals.flatMap((original) => {
    const index = itemIds.indexOf(original.incomeItemId);
    if (index < 0) return [];
    const isRefund = original.kind === "refund";
    const targetId = (isRefund ? refundedItemIds : reimbursementItemIds)[index];
    if (!targetId || targetId === original.targetItemId) return [];
    const label = (isRefund ? refundLabels : reimbursementLabels)[index] || "新选原支出";
    return [
      `${isRefund ? "退款" : "报销"}原支出：${original.label}（${original.targetItemId.slice(0, 8)}）→ ${label}（${targetId.slice(0, 8)}）`,
    ];
  });
  return changes.length > 0
    ? `${changes.join("；")}。同步修改后会重新计算旧支出与新支出的核销金额和状态。取消不会保存任何修改。`
    : null;
}

export function useLinkedTransactionEditAction(
  action: TransactionStateAction,
  runSaveAction: ReturnType<typeof useUnsavedChangesGuard>["runSaveAction"],
  initialLinkedTargets: OriginalLinkedTarget[] = [],
) {
  const pendingConfirmationRef = useRef<FormData | null>(null);
  const [retargetDescription, setRetargetDescription] = useState<string | null>(null);
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
        setRetargetDescription(describeLinkRetarget(formData, initialLinkedTargets));
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
