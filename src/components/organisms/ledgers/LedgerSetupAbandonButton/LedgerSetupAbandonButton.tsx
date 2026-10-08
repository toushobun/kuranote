"use client";

import { useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { ledgerSetupAbandonMessages as messages } from "config/ledgerSetupMessages";
import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import type { LedgerSetupAbandonAction } from "types/ledgers";
import { useAbandonLedgerSetup } from "./useAbandonLedgerSetup";

export function LedgerSetupAbandonButton(props: {
  action: LedgerSetupAbandonAction;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  ledgerId: string;
  ledgerName: string;
  onSuccess: () => void;
  onBusyChange?: (pending: boolean) => void;
}) {
  const flow = useAbandonLedgerSetup(props);
  const { onBusyChange } = props;
  useEffect(() => {
    onBusyChange?.(flow.pending);
  }, [flow.pending, onBusyChange]);
  return (
    <>
      <Button
        size={props.size}
        color="error"
        disabled={props.disabled || flow.pending}
        onClick={() => void flow.abandon()}
        variant="text"
      >
        {flow.pending ? (
          <CircularProgress
            aria-label={messages.pending}
            color="inherit"
            size={18}
          />
        ) : (
          messages.abandon
        )}
      </Button>
      <FailureFeedbackDialog
        description={flow.error}
        onClose={flow.dismissError}
        open={!!flow.error}
        title={messages.failed}
      />
    </>
  );
}
