import Chip, { type ChipProps } from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { TransactionBusinessStatus } from "internal/transaction";
import { getCurrencySymbol } from "utils/currency";
import { formatNumber } from "utils/transactions";

import {
  getIncomeLinkRoleBadgeKind,
  transactionBusinessBadgeConfig,
  type TransactionBusinessBadgeKind,
} from "./transactionBusinessBadgeConfig";

type TransactionBusinessBadgeProps = Omit<ChipProps, "color" | "label"> & {
  currency?: string;
  status: TransactionBusinessStatus;
};

type BusinessBadge = {
  amount?: string;
  kind: TransactionBusinessBadgeKind;
};

export function TransactionBusinessBadge({
  currency,
  size = "small",
  status,
  sx,
  ...props
}: TransactionBusinessBadgeProps) {
  const badges = resolveBusinessBadges(status);

  return (
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
      {badges.map(({ amount, kind }) => {
        const config = transactionBusinessBadgeConfig[kind];
        return (
          <Chip
            key={kind}
            label={
              amount
                ? `${config.label} ${getCurrencySymbol(currency)}${formatNumber(amount)}`
                : config.label
            }
            size={size}
            sx={[
              {
                backgroundColor: config.backgroundColor,
                color: config.color,
                fontWeight: 800,
              },
              ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...props}
          />
        );
      })}
    </Stack>
  );
}

function resolveBusinessBadges(
  status: TransactionBusinessStatus,
): BusinessBadge[] {
  const badges: BusinessBadge[] = [];
  if (status.settlementStatus === "pendingReimbursement") {
    badges.push({ kind: "pendingReimbursement" });
  } else if (status.settlementStatus === "reimbursed") {
    badges.push({ kind: getCompletedBadgeKind(status.offsetComposition) });
  }
  if (Number(status.offsetComposition.refundAmount) > 0) {
    badges.push({
      amount: status.offsetComposition.refundAmount,
      kind: "refundOffset",
    });
  }
  if (Number(status.offsetComposition.reimbursementAmount) > 0) {
    badges.push({
      amount: status.offsetComposition.reimbursementAmount,
      kind: "reimbursementOffset",
    });
  }
  if (status.incomeLinkRole) {
    badges.push({ kind: getIncomeLinkRoleBadgeKind(status.incomeLinkRole) });
  }
  return badges;
}

function getCompletedBadgeKind({
  refundAmount,
  reimbursementAmount,
}: TransactionBusinessStatus["offsetComposition"]):
  | "refunded"
  | "reimbursed"
  | "settled" {
  const hasRefund = Number(refundAmount) > 0;
  const hasReimbursement = Number(reimbursementAmount) > 0;
  if (hasRefund && !hasReimbursement) return "refunded";
  if (!hasRefund && hasReimbursement) return "reimbursed";
  return "settled";
}
