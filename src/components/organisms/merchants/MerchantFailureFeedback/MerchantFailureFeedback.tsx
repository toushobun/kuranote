"use client";

import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import type { MerchantActionState } from "types/merchants";

export function MerchantFailureFeedback({
  state,
  title,
}: {
  state: MerchantActionState;
  title: string;
}) {
  return <ActionFailureFeedback aboveModal state={state} title={title} />;
}
