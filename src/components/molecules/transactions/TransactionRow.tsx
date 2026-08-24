"use client";

import SyncAltIcon from "@mui/icons-material/SyncAlt";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Fragment, useSyncExternalStore } from "react";

import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { TransactionOriginalAmount } from "atoms/transactions/TransactionOriginalAmount";
import { serverFallbackTimeZone } from "config/dateTime";
import type { TransactionBusinessStatus } from "internal/transaction";
import { transactionOriginalAmountTextSx } from "theme/transactionAmountSx";
import { themeColorTokens } from "theme/themeColorTokens";
import { transactionAmountMessages } from "utils/transactionMessages";
import type {
  CategorySummaryItem,
  TransactionCategoryType,
  TransactionRowItem,
} from "types/transactions";
import { getMerchantInitial } from "utils/merchants";
import {
  formatTransactionRowAmount,
  formatTransactionTime,
} from "utils/transactions";

export type TransactionRowProps = {
  item: TransactionRowItem;
  receiptCard?: boolean;
  showAccount?: boolean;
  showRecorder?: boolean;
  showTime?: boolean;
};

type MetaSegment = {
  color: string;
  key: string;
  kind: "text";
  label: string;
};

type StatisticsAdjustment = {
  kind: "fullyExcluded" | "partiallyExcluded" | "partiallyOffset";
  type: TransactionCategoryType | null;
};

const textColor = "var(--user-theme-tx-name)";
const mutedText = "var(--user-theme-tx-meta)";
const expenseColor = "var(--user-theme-negative-amount)";
const incomeColor = "var(--user-theme-income-amount)";
const themeDotColor = "var(--user-theme-tx-accent)";

export function TransactionRow({
  item,
  receiptCard = false,
  showAccount = false,
  showRecorder = false,
  showTime = false,
}: TransactionRowProps) {
  const isTransfer = item.type === "transfer";
  const shouldShowRecorder = showRecorder && (item.show_recorder ?? true);
  const merchantName = isTransfer
    ? "账户周转"
    : (item.merchant_name ?? "未知商家");
  const statisticsAdjustment = getStatisticsAdjustment(item);
  const isFullyExcluded =
    statisticsAdjustment?.kind === "fullyExcluded" &&
    item.originalAmount !== undefined;
  const displayedAmountType = isFullyExcluded
    ? (item.originalType ?? statisticsAdjustment.type ?? item.type)
    : item.type;
  const amountColor = isTransfer
    ? textColor
    : displayedAmountType === "income"
      ? incomeColor
      : expenseColor;
  const businessStatuses = getBusinessStatuses(item.categoryItems);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone,
  );
  const time = formatTransactionTime(item.transaction_at, { timeZone });
  const signedAmount = isFullyExcluded
    ? formatTransactionRowAmount(
        item.originalType ?? statisticsAdjustment.type ?? item.type,
        item.originalAmount ?? item.amount,
        item.account_currency,
      )
    : formatRowAmount(item);
  const categorySummaryText = getTransactionCategorySummaryText(item);
  const detailText = [categorySummaryText, item.note]
    .filter(Boolean)
    .join(" | ");

  const metaSegments = [
    showAccount
      ? {
          color: getMemberColor(item.account_color),
          key: "account",
          kind: "text" as const,
          label: item.account_name,
        }
      : null,
    shouldShowRecorder && item.recorder_name
      ? {
          color: getMemberColor(item.recorder_color),
          key: "recorder",
          kind: "text" as const,
          label: item.recorder_name,
        }
      : null,
    showTime
      ? {
          color: mutedText,
          key: "time",
          kind: "text" as const,
          label: time,
        }
      : null,
  ].filter((segment): segment is MetaSegment => segment !== null);

  return (
    <Stack spacing={receiptCard ? 1 : 0.8} sx={{ px: 1.4, py: 1.45 }}>
      <Stack direction="row" spacing={1.2} sx={{ alignItems: "flex-start" }}>
        <Avatar
          alt={merchantName}
          src={isTransfer ? undefined : (item.merchant_icon_url ?? undefined)}
          variant="rounded"
          sx={{
            bgcolor: getAvatarBackground(item.type),
            borderRadius: 0.75,
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
              alignItems: "flex-start",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                color: textColor,
                flex: 1,
                fontSize: 15,
                fontWeight: 900,
                minWidth: 0,
              }}
            >
              {merchantName}
            </Typography>

            <Stack sx={{ alignItems: "flex-end", flexShrink: 0 }}>
              <Typography
                sx={{
                  color: amountColor,
                  fontSize: receiptCard ? 18 : 15,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                }}
              >
                {signedAmount}
              </Typography>
              {statisticsAdjustment ? (
                <Typography
                  component="span"
                  sx={transactionOriginalAmountTextSx}
                  variant="caption"
                >
                  {getStatisticsAdjustmentMessage(statisticsAdjustment)}
                </Typography>
              ) : item.originalAmount !== undefined ? (
                <TransactionOriginalAmount
                  amount={formatTransactionRowAmount(
                    item.originalType ?? item.type,
                    item.originalAmount,
                    item.account_currency,
                  )}
                />
              ) : null}
            </Stack>
          </Stack>

          {metaSegments.length > 0 ? (
            <Stack
              direction="row"
              sx={{ alignItems: "center", minWidth: 0, overflow: "hidden" }}
            >
              {metaSegments.map((segment, index) => (
                <Fragment key={segment.key}>
                  {index > 0 && (
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
                  )}
                  <Typography
                    noWrap
                    sx={{ color: segment.color, fontSize: 11 }}
                  >
                    {segment.label}
                  </Typography>
                </Fragment>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Stack>

      {detailText ? (
        <Typography
          noWrap
          sx={{
            color: mutedText,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {detailText}
        </Typography>
      ) : null}

      {businessStatuses.length > 0 ? (
        <Stack
          direction="row"
          spacing={0.5}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
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
  );
}

function getBusinessStatuses(
  categoryItems: CategorySummaryItem[],
): { key: string; status: TransactionBusinessStatus }[] {
  let settlementStatus: TransactionBusinessStatus["settlementStatus"] = null;
  let refundAmount = 0;
  let reimbursementAmount = 0;
  const incomeLinkRoles = new Set<
    NonNullable<TransactionBusinessStatus["incomeLinkRole"]>
  >();

  for (const category of categoryItems) {
    const status = category.businessStatus;
    if (!status) continue;
    if (status.settlementStatus === "pendingReimbursement") {
      settlementStatus = "pendingReimbursement";
    } else if (
      status.settlementStatus === "reimbursementSurplus" &&
      settlementStatus !== "pendingReimbursement"
    ) {
      settlementStatus = "reimbursementSurplus";
    } else if (
      status.settlementStatus === "reimbursed" &&
      settlementStatus === null
    ) {
      settlementStatus = "reimbursed";
    }
    refundAmount += Number(status.offsetComposition.refundAmount);
    reimbursementAmount += Number(status.offsetComposition.reimbursementAmount);
    if (status.incomeLinkRole) incomeLinkRoles.add(status.incomeLinkRole);
  }

  const statuses: { key: string; status: TransactionBusinessStatus }[] = [];
  if (settlementStatus || refundAmount > 0 || reimbursementAmount > 0) {
    statuses.push({
      key: "settlement-and-offsets",
      status: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: normalizeAggregatedAmount(refundAmount),
          reimbursementAmount: normalizeAggregatedAmount(reimbursementAmount),
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
      },
    });
  }
  return statuses;
}

function getStatisticsAdjustment(
  item: TransactionRowItem,
): StatisticsAdjustment | null {
  const adjustedItems = item.categoryItems.flatMap((category) => {
    const amount = Number(category.amount);
    const businessNetAmount = Number(category.businessNetAmount);
    if (
      category.businessNetAmount === undefined ||
      !Number.isFinite(amount) ||
      !Number.isFinite(businessNetAmount) ||
      amount === businessNetAmount
    ) {
      return [];
    }

    return [{ amount, businessNetAmount, type: category.categoryType ?? null }];
  });
  const fullyExcludedItems = adjustedItems.filter(
    ({ businessNetAmount }) => businessNetAmount === 0,
  );
  const partiallyOffsetItems = adjustedItems.filter(
    ({ amount, businessNetAmount }) =>
      businessNetAmount > 0 && businessNetAmount < amount,
  );

  if (fullyExcludedItems.length > 0) {
    const hasIncludedItem = item.categoryItems.some((category) => {
      const businessNetAmount =
        category.businessNetAmount === undefined
          ? Number(category.amount)
          : Number(category.businessNetAmount);
      return Number.isFinite(businessNetAmount) && businessNetAmount !== 0;
    });
    return {
      kind: hasIncludedItem ? "partiallyExcluded" : "fullyExcluded",
      type: getCommonCategoryType(fullyExcludedItems),
    };
  }

  if (partiallyOffsetItems.length > 0) {
    return {
      kind: "partiallyOffset",
      type: getCommonCategoryType(partiallyOffsetItems),
    };
  }

  if (item.originalAmount !== undefined && Number(item.amount) === 0) {
    return {
      kind: "fullyExcluded",
      type: item.originalType ?? (item.type === "transfer" ? null : item.type),
    };
  }

  return null;
}

function getCommonCategoryType(
  items: { type: TransactionCategoryType | null }[],
) {
  const firstType = items[0]?.type ?? null;
  return items.every(({ type }) => type === firstType) ? firstType : null;
}

function getStatisticsAdjustmentMessage(adjustment: StatisticsAdjustment) {
  if (adjustment.kind === "partiallyOffset") {
    return transactionAmountMessages.partiallyOffset;
  }

  if (adjustment.kind === "fullyExcluded") {
    if (adjustment.type === "income") {
      return transactionAmountMessages.notIncludedInIncome;
    }
    if (adjustment.type === "expense") {
      return transactionAmountMessages.notIncludedInExpense;
    }
    return transactionAmountMessages.notIncludedInStatistics;
  }

  if (adjustment.type === "income") {
    return transactionAmountMessages.partiallyNotIncludedInIncome;
  }
  if (adjustment.type === "expense") {
    return transactionAmountMessages.partiallyNotIncludedInExpense;
  }
  return transactionAmountMessages.partiallyNotIncludedInStatistics;
}

function normalizeAggregatedAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0
    ? String(Number(amount.toFixed(2)))
    : "0";
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
    .join("、")}等 ${item.categoryItems.length} 项`;
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
  if (type === "transfer") return "var(--user-theme-transfer-bg)";
  return "var(--user-theme-negative-bg)";
}

function getAvatarColor(type: TransactionRowItem["type"]) {
  if (type === "income") return incomeColor;
  if (type === "transfer") return themeDotColor;
  return expenseColor;
}

function getAvatarFallback(item: TransactionRowItem, merchantName: string) {
  if (item.type === "transfer") return <SyncAltIcon fontSize="small" />;
  if (item.merchant_name === null) return "?";
  return getMerchantInitial(merchantName, "?");
}

function getMemberColor(
  colorKey:
    | TransactionRowItem["account_color"]
    | TransactionRowItem["recorder_color"],
) {
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
