"use client";

import { useTheme } from "@mui/material/styles";

import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";

import { getMerchantFeedbackBottomOffset } from "../merchantFeedbackBottomOffset";
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
      bottomOffset={getMerchantFeedbackBottomOffset(theme)}
      state={state}
      title={title}
    />
  );
}
