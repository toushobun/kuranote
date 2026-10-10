"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "types/actions";

export type DeleteLedgerAction = (
  previous: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function useLedgerDeletion(
  action: DeleteLedgerAction,
  ledgerName: string,
) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState(action, {});
  const [dismissedErrorKey, setDismissedErrorKey] = useState<string>();
  return {
    open,
    step,
    name,
    pending,
    formAction,
    matched: name === ledgerName,
    error: state.errorKey !== dismissedErrorKey ? state.error : undefined,
    dismissError: () => setDismissedErrorKey(state.errorKey),
    setName,
    show: () => {
      setStep(1);
      setName("");
      setOpen(true);
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
