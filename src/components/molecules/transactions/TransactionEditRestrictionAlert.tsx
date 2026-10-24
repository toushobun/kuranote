import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import type { TransactionEditRestriction } from "internal/transaction";
import { transactionEditRestrictionMessages } from "utils/transactionMessages";

/** 只读详情顶部的限制原因（#928）。 */
export function TransactionEditRestrictionAlert({
  reason,
}: {
  reason: TransactionEditRestriction;
}) {
  return (
    <Alert severity="info">
      <AlertTitle>{transactionEditRestrictionMessages.title}</AlertTitle>
      {transactionEditRestrictionMessages[reason]}
    </Alert>
  );
}
