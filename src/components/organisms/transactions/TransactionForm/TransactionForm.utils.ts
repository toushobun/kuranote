import type {
  TransactionCategoryOption,
  TransactionRefundCandidate,
  TransactionType,
} from "types/transactions";
import { isValidMoneyText as isValidTransactionAmountText } from "utils/transactionAmountInput";
import type { TransactionLinkKind } from "utils/transactionMessages";
import {
  hasBusinessNetAmountOffset,
  hasLinkCandidateCurrencyMismatch,
} from "utils/transactions";

import type {
  TransactionFormItem,
  CategoryPickerGroup,
} from "./TransactionForm.types";

export { getCurrencySymbol } from "utils/currency";

const signedAmountPattern = /^-?\d+(\.\d+)?$/;

/** 金额文本求和：跳过空值和非数字，按其中最多的小数位取整，避免浮点误差。 */
export function sumAmountTexts(amounts: readonly (string | undefined)[]) {
  let total = 0;
  let decimals = 0;
  for (const amount of amounts) {
    const text = amount?.trim() ?? "";
    if (!signedAmountPattern.test(text)) continue;
    decimals = Math.max(decimals, text.split(".")[1]?.length ?? 0);
    total += Number(text);
  }
  return Number(total.toFixed(decimals));
}

/**
 * 明细的业务金额合计（扣除被其他记录退款 / 报销核销的部分，核销结余为负数）：
 * 标准记账的汇总与小票的净额共用同一口径。`hasBusinessOffset` 为有明细存在核销。
 */
export function sumTransactionItemBusinessTotals(
  items: readonly {
    amount: string;
    businessNetAmount?: string;
    type: TransactionType;
  }[],
) {
  const total = (type: TransactionType) =>
    sumAmountTexts(
      items
        .filter((item) => item.type === type)
        .map((item) => item.businessNetAmount ?? item.amount),
    );
  return {
    businessExpenseTotal: total("expense"),
    businessIncomeTotal: total("income"),
    hasBusinessOffset: items.some((item) =>
      hasBusinessNetAmountOffset(item.amount, item.businessNetAmount),
    ),
  };
}

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

/** 大分类里第一个未被禁用的小分类（#1046）；没有时返回空字符串。 */
export function getFirstEnabledCategoryId(
  group: CategoryPickerGroup | undefined,
  disabledCategoryType?: TransactionType,
) {
  return (
    group?.categories.find((option) => option.type !== disabledCategoryType)
      ?.id ?? ""
  );
}

export function getDefaultPickerCategory(
  groups: readonly CategoryPickerGroup[],
  disabledCategoryType?: TransactionType,
) {
  for (const group of groups) {
    const categoryId = getFirstEnabledCategoryId(group, disabledCategoryType);
    if (categoryId) return { groupId: group.id, categoryId };
  }
  return { groupId: groups[0]?.id ?? "", categoryId: "" };
}

export function isValidMoneyText(value: string, currency?: string) {
  return isValidTransactionAmountText(value, { currency });
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

export function isValidTransactionFormItem(
  item: TransactionFormItem,
  currency?: string,
) {
  return (
    item.categoryId.length > 0 &&
    isValidMoneyText(item.amount, currency)
  );
}
