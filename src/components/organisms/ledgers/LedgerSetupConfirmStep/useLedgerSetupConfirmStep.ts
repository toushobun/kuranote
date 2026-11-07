"use client";

import { useMemo, useRef, useState } from "react";

import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { buildLedgerSetupConfirmSummary } from "utils/ledgerSetupSummary";

type Options = Pick<
  LedgerSetupWizardStepProps,
  "onBusyChange" | "onComplete" | "progress"
>;

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
  const completingRef = useRef(false);

  async function complete() {
    if (completingRef.current) return;
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
    isCompleting,
    summary,
    complete() {
      void complete();
    },
  };
}
