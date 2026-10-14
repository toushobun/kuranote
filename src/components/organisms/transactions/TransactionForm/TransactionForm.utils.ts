import type {
  TransactionCategoryOption,
  TransactionRefundCandidate,
  TransactionType,
} from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { isValidMoneyText as isValidTransactionAmountText } from "utils/transactionAmountInput";
import {
  transactionAmountMessages,
  type TransactionLinkKind,
} from "utils/transactionMessages";
import { hasBusinessNetAmountOffset } from "utils/transactions";

import type { CategoryPickerGroup } from "./TransactionForm.types";

export { getCurrencySymbol } from "utils/currency";

export function buildCategoryPickerGroups(
  categories: TransactionCategoryOption[],
) {
  return categories.reduce<CategoryPickerGroup[]>((groups, category) => {
    const groupId = category.parentId ?? "";
    const groupName = category.parentName ?? category.name;
    const group = groups.find((currentGroup) => currentGroup.id === groupId);

    if (group) {
      group.categories.push(category);
      return groups;
    }

    groups.push({ categories: [category], id: groupId, name: groupName });
    return groups;
  }, []);
}

export function formatCategoryName(category: TransactionCategoryOption) {
  return category.parentName
    ? `${category.parentName} / ${category.name}`
    : category.name;
}

export function getTransactionItemAmountPresentation(
  amount: string,
  businessNetAmount: string | null | undefined,
  type: TransactionType,
) {
  const amountValue = Number(amount);
  const businessNetAmountValue = Number(businessNetAmount);
  const hasOffset = hasBusinessNetAmountOffset(amount, businessNetAmount);
  const adjustment =
    hasOffset &&
    Number.isFinite(businessNetAmountValue) &&
    businessNetAmountValue === 0
      ? "fullyExcluded"
      : hasOffset &&
          Number.isFinite(amountValue) &&
          Number.isFinite(businessNetAmountValue) &&
          businessNetAmountValue > 0 &&
          businessNetAmountValue < amountValue
        ? "partiallyOffset"
        : null;
  const isSurplus =
    hasOffset &&
    Number.isFinite(businessNetAmountValue) &&
    businessNetAmountValue < 0;

  return {
    adjustment,
    displayAmount:
      adjustment === "fullyExcluded"
        ? (businessNetAmount ?? amount)
        : isSurplus
          ? String(Math.abs(businessNetAmountValue))
          : (businessNetAmount ?? amount),
    displayType:
      isSurplus && type === "expense"
        ? "income"
        : isSurplus && type === "income"
          ? "expense"
          : type,
    hasOffset,
  } as const;
}

export function getTransactionItemAdjustmentMessage(
  adjustment: "fullyExcluded" | "partiallyOffset" | null,
) {
  if (adjustment === "partiallyOffset") {
    return transactionAmountMessages.partiallyOffset;
  }
  return null;
}

export function formatSummaryDateTime(date: string, time: string) {
  const dateParts = date.split("-");
  if (dateParts.length !== 3) return "未选择";

  const timeParts = time.split(":");
  if (timeParts.length < 2) return "未选择";

  return `${dateParts[0]}/${dateParts[1]}/${dateParts[2]} ${timeParts[0]}:${timeParts[1]}:${timeParts[2] ?? "00"}`;
}

export function formatSignedCurrencyAmount(value: string, currency?: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue === "未填写金额") return value;

  const sign = trimmedValue.startsWith("-")
    ? "-"
    : trimmedValue.startsWith("+")
      ? "+"
      : "";
  const amount = sign ? trimmedValue.slice(1) : trimmedValue;
  const symbol = currency ? getCurrencySymbol(currency) : "";

  return [sign, symbol, amount].filter(Boolean).join(" ");
}

export function isValidMoneyText(value: string, currency?: string) {
  return isValidTransactionAmountText(value, { currency });
}

// 退款 / 报销关联的候选必须与收款账户币种一致；账户未选择时视为不一致。
export function hasLinkCandidateCurrencyMismatch(
  candidate: TransactionRefundCandidate | null | undefined,
  currency: string | undefined,
): boolean {
  return Boolean(candidate && candidate.accountCurrency !== currency);
}

// 按固定顺序（退款 → 报销）返回与账户币种不一致的关联种类。
export function getCurrencyMismatchedLinkKinds(
  links: {
    refundCandidate?: TransactionRefundCandidate | null;
    reimbursementCandidate?: TransactionRefundCandidate | null;
  },
  currency: string | undefined,
): TransactionLinkKind[] {
  const kinds: TransactionLinkKind[] = [];
  if (hasLinkCandidateCurrencyMismatch(links.refundCandidate, currency)) {
    kinds.push("refund");
  }
  if (
    hasLinkCandidateCurrencyMismatch(links.reimbursementCandidate, currency)
  ) {
    kinds.push("reimbursement");
  }
  return kinds;
}
