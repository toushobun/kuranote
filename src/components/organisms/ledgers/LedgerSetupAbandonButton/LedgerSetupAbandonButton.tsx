"use client";

import { useEffect } from "react";
import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import { actionPendingMessages } from "config/actionPendingMessages";
import {
  ledgerSetupAbandonMessages as messages,
  ledgerSetupEntryMessages,
} from "config/ledgerSetupMessages";
import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import type { LedgerSetupAbandonAction } from "types/ledgers";
import { useAbandonLedgerSetup } from "./useAbandonLedgerSetup";

export function LedgerSetupAbandonButton(props: {
  action: LedgerSetupAbandonAction;
  disabled?: boolean;
  restart?: boolean;
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
      <ActionButton
        size={props.size}
        color="error"
        disabled={props.disabled}
        pending={flow.pending}
        pendingLabel={actionPendingMessages.abandon}
        onClick={() => void flow.abandon()}
        variant="text"
        sx={props.restart ? restartSx : undefined}
      >
        {props.restart ? ledgerSetupEntryMessages.restart : messages.abandon}
      </ActionButton>
      <FailureFeedbackDialog
        description={flow.error}
        onClose={flow.dismissError}
        open={!!flow.error}
        title={messages.failed}
      />
    </>
  );
}

const restartSx = {
  minHeight: 44,
  minWidth: 0,
  px: 0.5,
  my: -1,
  textDecoration: "underline",
};
