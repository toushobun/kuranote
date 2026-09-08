"use client";

import { useTheme } from "@mui/material/styles";

import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type { MerchantActionState } from "types/merchants";

export function MerchantFailureFeedback({
  state,
  title,
}: {
  state: MerchantActionState;
  title: string;
}) {
  const theme = useTheme();

  return (
    <ActionFailureFeedback
      aboveModal
      bottomOffset={`calc(${bottomNavigationLayout.shellPaddingBottom} + ${theme.spacing(1)})`}
      state={state}
      title={title}
    />
  );
}
