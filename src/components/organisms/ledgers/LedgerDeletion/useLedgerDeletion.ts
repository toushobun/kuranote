"use client";

import { useActionState, useRef, useState } from "react";
import { ledgerDeletionMessages } from "config/ledgerDeletionMessages";
import type { ActionState } from "types/actions";
import type {
  LedgerDeletionImpactState,
  LoadLedgerDeletionImpactAction,
} from "types/ledgers";

export type DeleteLedgerAction = (
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function useLedgerDeletion({
  action,
  ledgerId,
  ledgerName,
  loadImpact,
}: {
  action: DeleteLedgerAction;
  ledgerId: string;
  ledgerName: string;
  loadImpact: LoadLedgerDeletionImpactAction;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  // undefined 表示读取中。
  const [impactState, setImpactState] = useState<LedgerDeletionImpactState>();
  const impactRequest = useRef(0);
  const [state, formAction, pending] = useActionState(action, {});
  const [dismissedErrorKey, setDismissedErrorKey] = useState<string>();
  return {
    open,
    step,
    name,
    pending,
    formAction,
    impact: impactState?.impact,
    impactError: impactState?.error,
    impactLoading: impactState === undefined,
    matched: name === ledgerName,
    error: state.errorKey !== dismissedErrorKey ? state.error : undefined,
    dismissError: () => setDismissedErrorKey(state.errorKey),
    setName,
    show: () => {
      setStep(1);
      setName("");
      setImpactState(undefined);
      setOpen(true);
      // 重新打开时忽略上一次尚未返回的读取结果。
      const request = ++impactRequest.current;
      void loadImpact(ledgerId)
        .catch(
          (): LedgerDeletionImpactState => ({
            error: ledgerDeletionMessages.impactUnavailable,
          }),
        )
        .then((result) => {
          if (request === impactRequest.current) setImpactState(result);
        });
    },
    close: () => {
      if (!pending) setOpen(false);
    },
    next: () => {
      if (!pending) setStep(2);
    },
    back: () => {
      if (!pending) setStep(1);
    },
  };
}
