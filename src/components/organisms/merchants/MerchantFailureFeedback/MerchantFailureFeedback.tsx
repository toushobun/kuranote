"use client";

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
  return (
    <ActionFailureFeedback
      aboveModal
      bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
      state={state}
      title={title}
    />
  );
}
