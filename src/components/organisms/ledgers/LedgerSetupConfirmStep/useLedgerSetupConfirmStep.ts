"use client";

import { useMemo, useRef, useState } from "react";

import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type { ActionState } from "types/actions";
import type { LedgerSetupProgress } from "types/ledgers";
import { buildLedgerSetupConfirmSummary } from "utils/ledgerSetupSummary";

type Options = Pick<
  LedgerSetupWizardStepProps,
  "onBusyChange" | "onComplete"
> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupConfirmStep({
  onBusyChange,
  onComplete,
  progress,
}: Options) {
  const summary = useMemo(
    () => buildLedgerSetupConfirmSummary(progress),
    [progress],
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [failureState] = useState<ActionState>({});
  const completingRef = useRef(false);

  async function complete() {
    if (completingRef.current || !onComplete) return;
    completingRef.current = true;
    setIsCompleting(true);
    onBusyChange(true);
    try {
      await onComplete();
    } finally {
      completingRef.current = false;
      setIsCompleting(false);
      onBusyChange(false);
    }
  }

  return {
    failureState,
    isCompleting,
    isLocked: isCompleting,
    isUnavailable: false,
    summary,
    complete() {
      void complete();
    },
  };
}
