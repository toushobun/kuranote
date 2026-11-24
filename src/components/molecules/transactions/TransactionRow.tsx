"use client";

import SyncAltIcon from "@mui/icons-material/SyncAlt";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Fragment, useSyncExternalStore, type ReactNode } from "react";

import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { TransactionOriginalAmount } from "atoms/transactions/TransactionOriginalAmount";
import { TransactionSharedPaymentNote } from "atoms/transactions/TransactionSharedPaymentNote";
import { balanceAdjustmentText } from "config/balanceAdjustmentText";
import { transferReceiptMessages } from "config/transactionStepFlowMessages";
import { serverFallbackTimeZone } from "config/dateTime";
import {
  transactionFallbackLabels,
  type TransactionBusinessStatus,
} from "internal/transaction";
import { designTokens } from "theme/theme";
import { themeColorTokens } from "theme/themeColorTokens";
import {
  transactionCategorySummaryMessages,
  transactionSharedPaymentMessages,
} from "utils/transactionMessages";
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";
import type {
  CategorySummaryItem,
  TransactionCategoryType,
  TransactionRowItem,
} from "types/transactions";
import { getMerchantInitial } from "utils/merchants";
import {
  formatTransactionRowAmount,
  formatTransactionTime,
  formatUnsignedCurrencyAmount,
} from "utils/transactions";

export type TransactionRowProps = {
  item: TransactionRowItem;
  photoAction?: ReactNode;
  linkLabelIds?: { amount: string; merchant: string };
  receiptCard?: boolean;
  showAccount?: boolean;
  showTime?: boolean;
};

const textColor = "var(--user-theme-tx-name)";
const mutedText = "var(--user-theme-tx-meta)";
const expenseColor = "var(--user-theme-negative-amount)";
const incomeColor = "var(--user-theme-income-amount)";
const themeDotColor = "var(--user-theme-tx-accent)";

export function TransactionRow({
  item,
  photoAction,
  linkLabelIds,
  receiptCard = false,
  showAccount = false,
  showTime = false,
}: TransactionRowProps) {
  const isAdjustment = item.type === "balance_adjustment";
  const isTransfer = item.type === "transfer";
  const merchantName = isAdjustment
    ? balanceAdjustmentText.title
    : isTransfer
      ? "账户周转"
      : (item.merchant_name ?? transactionFallbackLabels.merchant);
  const amountColor = isAdjustment
    ? Number(item.amount) > 0
      ? incomeColor
      : expenseColor
    : isTransfer
      ? textColor
      : item.type === "income"
        ? incomeColor
        : expenseColor;
  const businessStatuses = isTransfer
    ? []
    : getBusinessStatuses(item.categoryItems, item.account_currency);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone,
  );
  const time = formatTransactionTime(item.transaction_at, { timeZone });
  const signedAmount = formatRowAmount(item);
  const sharedPaymentLabel = getSharedPaymentLabel(item);
  const feeLabel =
    isTransfer && item.transferFeeAmount
      ? transferReceiptMessages.listFee(
          formatUnsignedCurrencyAmount(
            item.transferFeeAmount,
            item.account_currency,
          ),
        )
      : null;
  const transferAmountLabel =
    isTransfer &&
    item.transferTargetAmount &&
    item.transferTargetCurrency &&
    item.transferTargetCurrency !== item.account_currency
      ? `${signedAmount} → ${formatUnsignedCurrencyAmount(
          item.transferTargetAmount,
          item.transferTargetCurrency,
        )} ${item.transferTargetCurrency}`
      : signedAmount;
  const categorySummaryText = getTransactionCategorySummaryText(item);
  const detailText = categorySummaryText ?? "";
  const hasDetailRow = Boolean(
    detailText || item.note || businessStatuses.length > 0,
  );
  const adjustmentNode =
    item.originalAmount !== undefined ? (
      <TransactionOriginalAmount
        amount={formatTransactionRowAmount(
          item.originalType ?? item.type,
          item.originalAmount,
          item.account_currency,
        )}
      />
    ) : null;

  const metaSegments = [
    showAccount || isAdjustment
      ? {
          color: getMemberColor(item.account_color),
          key: "account",
          kind: "text" as const,
          label: item.account_name,
        }
      : null,
    showTime || isAdjustment
      ? {
          color: mutedText,
          key: "time",
          kind: "text" as const,
          label: time,
        }
      : null,
    photoAction
      ? { key: "photo", kind: "action" as const, node: photoAction }
      : null,
  ].filter(
    (segment): segment is NonNullable<typeof segment> => segment !== null,
  );

  return (
    <Stack
      spacing={receiptCard ? 1 : 0.8}
      sx={{
        px: 1.4,
        pt: 1.45,
        pb: hasDetailRow ? 0.8 : 1.45,
      }}
    >
      <Stack direction="row" spacing={1.2} sx={{ alignItems: "flex-start" }}>
        <Avatar
          alt={merchantName}
          src={isTransfer ? undefined : (item.merchant_icon_url ?? undefined)}
          variant="rounded"
          sx={{
            bgcolor: getAvatarBackground(item.type),
            borderRadius: `${designTokens.radius.item}px`,
            color: getAvatarColor(item.type),
            flexShrink: 0,
            fontSize: 15,
            fontWeight: 900,
            height: receiptCard ? 44 : 38,
            width: receiptCard ? 44 : 38,
          }}
        >
          {getAvatarFallback(item, merchantName)}
        </Avatar>

        <Stack spacing={0.55} sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "baseline",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            <Typography
              id={linkLabelIds?.merchant}
              noWrap
              sx={{
                color: textColor,
                flex: 1,
                fontSize: 15,
                fontWeight: 900,
                lineHeight: 1.15,
                minWidth: 0,
              }}
            >
              {merchantName}
            </Typography>

            <Typography
              id={linkLabelIds?.amount}
              sx={{
                color: amountColor,
                flexShrink: 0,
                fontSize: receiptCard ? 18 : 15,
                fontWeight: 900,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              }}
            >
              {transferAmountLabel}
            </Typography>
          </Stack>

          {sharedPaymentLabel ? (
            <TransactionSharedPaymentNote label={sharedPaymentLabel} />
          ) : null}
          {metaSegments.length > 0 || adjustmentNode || isTransfer ? (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                minHeight: isTransfer ? 17 : undefined,
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                {metaSegments.map((segment, index) => (
                  <Fragment key={segment.key}>
                    {index > 0 && segment.kind === "text" && (
                      <RowSeparator />
                    )}
                    {segment.kind === "action" ? (
                      segment.node
                    ) : (
                      <Typography
                        noWrap
                        sx={{ color: segment.color, fontSize: 11 }}
                      >
                        {segment.label}
                      </Typography>
                    )}
                  </Fragment>
                ))}
              </Stack>
              {feeLabel ? (
                <Typography
                  noWrap
                  sx={{
                    color: mutedText,
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    ml: "auto",
                    textAlign: "right",
                  }}
                >
                  {feeLabel}
                </Typography>
              ) : null}
              {adjustmentNode ? (
                <Box sx={{ display: "flex", flexShrink: 0 }}>
                  {adjustmentNode}
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Stack>

      {hasDetailRow ? (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 0.5,
            minHeight: 20,
            minWidth: 0,
          }}
        >
          {detailText || item.note ? (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              {detailText ? (
                <Typography
                  noWrap
                  sx={{
                    color: mutedText,
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    maxWidth: "100%",
                  }}
                >
                  {detailText}
                </Typography>
              ) : null}
              {detailText && item.note ? (
                <RowSeparator />
              ) : null}
              {item.note ? (
                <Typography
                  noWrap
                  sx={{
                    color: mutedText,
                    flex: 1,
                    fontSize: 11,
                    minWidth: 0,
                  }}
                >
                  {item.note}
                </Typography>
              ) : null}
            </Stack>
          ) : null}
          {businessStatuses.length > 0 ? (
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{
                flexShrink: 0,
                flexWrap: "nowrap",
                ml: "auto",
                "& > .MuiStack-root": { flexWrap: "nowrap" },
              }}
            >
              {businessStatuses.map(({ key, status }) => (
                <TransactionBusinessBadge
                  currency={item.account_currency}
                  key={key}
                  status={status}
                  sx={businessBadgeSx}
                />
              ))}
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

function RowSeparator() {
  return (
    <Typography
      sx={{
        color: mutedText,
        flexShrink: 0,
        fontSize: 11,
        mx: 0.6,
      }}
    >
      {"|"}
    </Typography>
  );
}

function getBusinessStatuses(
  categoryItems: CategorySummaryItem[],
  currency?: string,
): { key: string; status: TransactionBusinessStatus }[] {
  let settlementStatus: TransactionBusinessStatus["settlementStatus"] = null;
  let refundAmount = 0;
  let reimbursementAmount = 0;
  let surplusAmount = 0;
  const incomeLinkRoles = new Set<
    NonNullable<TransactionBusinessStatus["incomeLinkRole"]>
  >();

  for (const category of categoryItems) {
    const status = category.businessStatus;
    if (!status) continue;
    if (status.settlementStatus === "pendingReimbursement") {
      settlementStatus = "pendingReimbursement";
    } else if (
      (status.settlementStatus === "reimbursed" ||
        status.settlementStatus === "reimbursementSurplus") &&
      settlementStatus === null
    ) {
      settlementStatus = "reimbursed";
    }

    refundAmount += Number(status.offsetComposition.refundAmount);
    reimbursementAmount += Number(status.offsetComposition.reimbursementAmount);
    if (status.incomeLinkRole) {
      incomeLinkRoles.add(status.incomeLinkRole);
      surplusAmount += Number(status.surplusAmount ?? "0");
    }
  }

  // 仅退款结清的支出没有数据库特殊状态，但仍需显示「已退款」。
  const fullyRefundedExpense = categoryItems.some((category) => {
    if (category.categoryType !== "expense") return false;
    const status = category.businessStatus;
    if (!status || status.incomeLinkRole) return false;
    const totalOffset =
      Number(status.offsetComposition.refundAmount) +
      Number(status.offsetComposition.reimbursementAmount);
    return totalOffset > 0 && totalOffset >= Number(category.amount);
  });
  if (settlementStatus === null && fullyRefundedExpense) {
    settlementStatus = "reimbursed";
  }

  const statuses: { key: string; status: TransactionBusinessStatus }[] = [];
  if (settlementStatus || refundAmount > 0 || reimbursementAmount > 0) {
    statuses.push({
      key: "settlement-and-offsets",
      status: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: normalizeAggregatedAmount(refundAmount, currency),
          reimbursementAmount: normalizeAggregatedAmount(
            reimbursementAmount,
            currency,
          ),
        },
        settlementStatus,
      },
    });
  }
  for (const incomeLinkRole of ["refund", "reimbursement"] as const) {
    if (!incomeLinkRoles.has(incomeLinkRole)) continue;
    statuses.push({
      key: `${incomeLinkRole}-income`,
      status: {
        incomeLinkRole,
        offsetComposition: { refundAmount: "0", reimbursementAmount: "0" },
        settlementStatus: null,
        surplusAmount: statuses.some(
          ({ status }) => Number(status.surplusAmount) > 0,
        )
          ? undefined
          : normalizeAggregatedAmount(surplusAmount, currency),
      },
    });
  }
  return statuses;
}

function normalizeAggregatedAmount(amount: number, currency?: string) {
  return Number.isFinite(amount) && amount > 0
    ? String(Number(amount.toFixed(getAmountDecimalPlaces(currency))))
    : "0";
}

// 共同支付行夹在当前金额和原金额之间，只显示整笔金额（#909 追加 2）。
function getSharedPaymentLabel(item: TransactionRowItem) {
  if (item.record_total_amount === undefined) return null;

  return transactionSharedPaymentMessages.recordTotal(
    formatUnsignedCurrencyAmount(
      item.record_total_amount,
      item.account_currency,
    ),
  );
}

function formatRowAmount(item: TransactionRowItem) {
  return formatTransactionRowAmount(
    item.type,
    item.amount,
    item.account_currency,
  );
}

function getTransactionCategorySummaryText(item: TransactionRowItem) {
  if (item.type === "transfer" || item.categoryItems.length === 0) return null;

  if (item.categoryItems.length === 1) {
    return item.categoryItems[0]?.categoryName ?? null;
  }

  if (item.categoryItems.length <= 3) {
    return item.categoryItems
      .map((category) => category.categoryName)
      .join("、");
  }

  const targetTone = getCategoryTargetTone(item);
  const topCategories = item.categoryItems
    .filter(
      (category) =>
        getCategoryTone(category.categoryType, item.type) === targetTone,
    )
    .sort(compareCategoryAmountDesc)
    .slice(0, 3);

  if (topCategories.length === 0) return null;

  return `${topCategories
    .map((category) => category.categoryName)
    .join("、")}${transactionCategorySummaryMessages.more}`;
}

function getCategoryTargetTone(item: TransactionRowItem): "income" | "expense" {
  return item.type === "income" ? "income" : "expense";
}

function getCategoryTone(
  categoryType: TransactionCategoryType | undefined,
  fallbackType: TransactionRowItem["type"],
): "income" | "expense" {
  const normalizedType = categoryType ?? fallbackType;

  if (normalizedType === "income") {
    return "income";
  }

  return "expense";
}

function compareCategoryAmountDesc(
  categoryA: CategorySummaryItem,
  categoryB: CategorySummaryItem,
) {
  const amountA = Number(categoryA.amount);
  const amountB = Number(categoryB.amount);

  if (!Number.isFinite(amountA) && !Number.isFinite(amountB)) return 0;
  if (!Number.isFinite(amountA)) return 1;
  if (!Number.isFinite(amountB)) return -1;

  return amountB - amountA;
}

function getAvatarBackground(type: TransactionRowItem["type"]) {
  if (type === "income") return "var(--user-theme-income-bg)";
  if (type === "transfer" || type === "balance_adjustment")
    return "var(--user-theme-transfer-bg)";
  return "var(--user-theme-negative-bg)";
}

function getAvatarColor(type: TransactionRowItem["type"]) {
  if (type === "income") return incomeColor;
  if (type === "transfer" || type === "balance_adjustment")
    return themeDotColor;
  return expenseColor;
}

function getAvatarFallback(item: TransactionRowItem, merchantName: string) {
  if (item.type === "transfer" || item.type === "balance_adjustment")
    return <SyncAltIcon fontSize="small" />;
  if (item.merchant_name === null) return "?";
  return getMerchantInitial(merchantName, "?");
}

function getMemberColor(colorKey: TransactionRowItem["account_color"]) {
  return colorKey ? themeColorTokens[colorKey].chipText : mutedText;
}

function subscribeToTimeZone() {
  return () => {};
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimeZone() {
  return serverFallbackTimeZone;
}

const businessBadgeSx = {
  fontSize: "0.625rem",
  height: 20,
  "& .MuiChip-label": { px: 0.75 },
};
