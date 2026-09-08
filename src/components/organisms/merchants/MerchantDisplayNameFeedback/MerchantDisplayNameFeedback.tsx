"use client";

import { useTheme } from "@mui/material/styles";
import { useState } from "react";

import { merchantText } from "config/merchantText";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type { MerchantActionState } from "types/merchants";

import { MerchantFailureFeedback } from "../MerchantFailureFeedback/MerchantFailureFeedback";

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
        bottomOffset={`calc(${bottomNavigationLayout.shellPaddingBottom} + ${theme.spacing(1)})`}
        onClose={() => setDismissedState(state)}
        open={Boolean(state.success) && state !== dismissedState}
        title={state.success ?? merchantText.preferredSuccess}
      />
    </>
  );
}
