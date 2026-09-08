"use client";

import { useTheme } from "@mui/material/styles";
import { useState } from "react";

import { merchantText } from "config/merchantText";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";

import { getMerchantFeedbackBottomOffset } from "../merchantFeedbackBottomOffset";
import { MerchantFailureFeedback } from "../MerchantFailureFeedback/MerchantFailureFeedback";
import type { MerchantActionState } from "types/merchants";

export function MerchantDisplayNameFeedback({
  errorTitle = merchantText.preferredErrorTitle,
  state,
}: {
  errorTitle?: string;
  state: MerchantActionState;
}) {
  const theme = useTheme();
  const [dismissedState, setDismissedState] =
    useState<MerchantActionState | null>(null);

  return (
    <>
      <MerchantFailureFeedback state={state} title={errorTitle} />
      <SuccessFeedbackDialog
        bottomOffset={getMerchantFeedbackBottomOffset(theme)}
        onClose={() => setDismissedState(state)}
        open={Boolean(state.success) && state !== dismissedState}
        title={state.success ?? merchantText.preferredSuccess}
      />
    </>
  );
}
