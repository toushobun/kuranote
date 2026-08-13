import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type {
  TransactionAccountOption,
  TransactionMerchantOption,
} from "types/transactions";
import { hasBusinessNetAmountOffset } from "utils/transactions";

import type { TransactionItemSummary } from "../TransactionForm/TransactionForm.types";
import { transactionSummarySurfaceSx } from "../TransactionForm/TransactionForm.styles";
import {
  formatCategoryName,
  formatSignedCurrencyAmount,
  formatSummaryDateTime,
} from "../TransactionForm/TransactionForm.utils";

type TransactionSummarySectionProps = {
  businessTotalAmount?: string | null;
  itemSummaries: TransactionItemSummary[];
  selectedAccount?: TransactionAccountOption;
  selectedMerchant?: TransactionMerchantOption;
  signedTotalAmount: string;
  transactionDate: string;
  transactionTime: string;
};

export function TransactionSummarySection({
  businessTotalAmount = null,
  itemSummaries,
  selectedAccount,
  selectedMerchant,
  signedTotalAmount,
  transactionDate,
  transactionTime,
}: TransactionSummarySectionProps) {
  return (
    <Box sx={transactionSummarySurfaceSx}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={summaryTitleSx}>
          保存前汇总
        </Typography>
        <SummaryRow label="商家" value={selectedMerchant?.name ?? "未选择"} />
        <SummaryRow
          label="账户"
          value={
            selectedAccount
              ? `${selectedAccount.name}（${selectedAccount.currency}）`
              : "未选择"
          }
        />
        {itemSummaries.map((item, index) => (
          <SummaryRow
            key={item.id}
            label={`明细 ${index + 1}`}
            value={`${item.category ? formatCategoryName(item.category) : "未选择分类"} / ${formatItemSummaryAmount(item)}`}
          />
        ))}
        <SummaryRow
          label="时间"
          value={formatSummaryDateTime(transactionDate, transactionTime)}
        />
        <Divider />
        {businessTotalAmount ? (
          <SummaryRow
            label="原始合计"
            value={formatSignedCurrencyAmount(
              signedTotalAmount,
              selectedAccount?.currency,
            )}
          />
        ) : null}
        <SummaryRow
          label={businessTotalAmount ? "业务净额" : "合计金额"}
          value={formatSignedCurrencyAmount(
            businessTotalAmount ?? signedTotalAmount,
            selectedAccount?.currency,
          )}
          strong
        />
      </Stack>
    </Box>
  );
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Typography color="text.secondary" sx={summaryLabelSx}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: strong ? "var(--user-theme-action-text)" : "text.primary",
          fontSize: strong ? "0.9375rem" : "0.75rem",
          fontWeight: strong ? 800 : 500,
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

const summaryTitleSx = {
  fontSize: "0.8125rem",
  fontWeight: 800,
};

const summaryLabelSx = {
  fontSize: "0.75rem",
};

function formatItemSummaryAmount(item: TransactionItemSummary) {
  const businessAmount = item.businessNetAmount ?? item.amount;
  if (!businessAmount) return "未填写金额";
  if (!hasBusinessNetAmountOffset(item.amount, item.businessNetAmount)) {
    return businessAmount;
  }
  return `${businessAmount}（原金额 ${item.amount}）`;
}
