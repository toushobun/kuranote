"use client";

import { useState } from "react";

import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import type { MerchantActionState } from "types/merchants";

export function MerchantFailureFeedback({
  state,
  title,
}: {
  state: MerchantActionState;
  title: string;
}) {
  const currentErrorKey = state.errorKey ?? state.error ?? null;
  const [closedErrorKey, setClosedErrorKey] = useState<string | null>(null);
  const open = state.error !== undefined && currentErrorKey !== closedErrorKey;

  return (
    <FailureFeedbackDialog
      aboveModal
      description={state.error ?? null}
      onClose={() => setClosedErrorKey(currentErrorKey)}
      open={open}
      title={title}
    />
  );
}
