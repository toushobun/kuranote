"use client";

import { useRef, useState } from "react";
import { ledgerSetupAbandonMessages as messages } from "config/ledgerSetupMessages";
import { ledgerSetupWriteErrorMessages } from "internal/ledger";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type { LedgerSetupAbandonAction } from "types/ledgers";

export function useAbandonLedgerSetup({
  action,
  ledgerId,
  ledgerName,
  onSuccess,
}: {
  action: LedgerSetupAbandonAction;
  ledgerId: string;
  ledgerName: string;
  onSuccess: () => void;
}) {
  const confirm = useConfirmDialog();
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function abandon() {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      if (
        !(await confirm({
          title: messages.title(ledgerName),
          description: messages.description,
          confirmLabel: messages.abandon,
          cancelLabel: messages.cancel,
          confirmColor: "error",
          tone: "delete",
        }))
      )
        return;
      const result = await action({ ledgerId });
      if (result.error) setError(result.error);
      else onSuccess();
    } catch {
      setError(ledgerSetupWriteErrorMessages.abandonFailed);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { abandon, pending, error, dismissError: () => setError(null) };
}
