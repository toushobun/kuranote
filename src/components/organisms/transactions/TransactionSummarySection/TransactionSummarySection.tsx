import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { TransactionOriginalAmount } from "atoms/transactions/TransactionOriginalAmount";
import type {
  TransactionAccountOption,
  TransactionMerchantOption,
} from "types/transactions";
import {
  formatTransactionRowAmount,
  hasBusinessNetAmountOffset,
} from "utils/transactions";
import { transactionAmountMessages } from "utils/transactionMessages";

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
            value={
              <ItemSummaryValue
                currency={selectedAccount?.currency}
                item={item}
              />
            }
          />
        ))}
        <SummaryRow
          label="时间"
          value={formatSummaryDateTime(transactionDate, transactionTime)}
        />
        <Divider />
        <SummaryRow
          label={
            businessTotalAmount
              ? transactionAmountMessages.netAmount
              : "合计金额"
          }
          value={formatSignedCurrencyAmount(
            businessTotalAmount ?? signedTotalAmount,
            selectedAccount?.currency,
          )}
          strong
        />
        {businessTotalAmount ? (
          <SummaryRow
            label={transactionAmountMessages.originalAmount}
            muted
            value={formatSignedCurrencyAmount(
              signedTotalAmount,
              selectedAccount?.currency,
            )}
          />
        ) : null}
      </Stack>
    </Box>
  );
}

function SummaryRow({
  label,
  muted = false,
  strong = false,
  value,
}: {
  label: string;
  muted?: boolean;
  strong?: boolean;
  value: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Typography
        color={muted ? "text.disabled" : "text.secondary"}
        sx={summaryLabelSx}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: strong
            ? "var(--user-theme-action-text)"
            : muted
              ? "text.disabled"
              : "text.primary",
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

function ItemSummaryValue({
  currency,
  item,
}: {
  currency?: string;
  item: TransactionItemSummary;
}) {
  const amount = Number(item.amount);
  const businessNetAmount = Number(item.businessNetAmount);
  const hasOffset = hasBusinessNetAmountOffset(
    item.amount,
    item.businessNetAmount,
  );
  const isFullyExcluded =
    hasOffset && Number.isFinite(businessNetAmount) && businessNetAmount === 0;
  const isPartiallyOffset =
    hasOffset &&
    Number.isFinite(amount) &&
    Number.isFinite(businessNetAmount) &&
    businessNetAmount > 0 &&
    businessNetAmount < amount;
  const businessAmount = isFullyExcluded
    ? item.amount
    : (item.businessNetAmount ?? item.amount);
  const categoryName = item.category
    ? formatCategoryName(item.category)
    : "未选择分类";
  if (!businessAmount) return `${categoryName} / 未填写金额`;
  const categoryType = item.category?.type ?? "expense";
  const formattedBusinessAmount = formatTransactionRowAmount(
    categoryType,
    businessAmount,
    currency,
  );
  if (!hasOffset) {
    return `${categoryName} / ${formattedBusinessAmount}`;
  }

  const adjustmentMessage = isFullyExcluded
    ? categoryType === "income"
      ? transactionAmountMessages.notIncludedInIncome
      : transactionAmountMessages.notIncludedInExpense
    : isPartiallyOffset
      ? transactionAmountMessages.partiallyOffset
      : null;

  return (
    <>
      {categoryName} / {formattedBusinessAmount}
      {adjustmentMessage ? (
        <Typography
          component="span"
          sx={{ color: "text.disabled", fontWeight: 400 }}
        >
          {`（${adjustmentMessage}）`}
        </Typography>
      ) : (
        <TransactionOriginalAmount
          amount={formatTransactionRowAmount(
            categoryType,
            item.amount,
            currency,
          )}
          parenthesized
        />
      )}
    </>
  );
}
