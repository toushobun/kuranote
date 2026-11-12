import { formatRefundMinorUnits, toRefundMinorUnits } from "internal/transaction/util/refundAllocation";
import type { TransactionListItem } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionRefundCandidate } from "internal/transaction/entity/transactionReadModels";

/** 把候选记录展开成原支出明细；服务端分页与搜索展示共用相同转换。 */
export function toTransactionLinkCandidates(
  items: TransactionListItem[],
): TransactionRefundCandidate[] {
  return items.flatMap((record) =>
    record.categoryItems.flatMap((item) => {
      if (
        item.categoryType !== "expense" ||
        !item.id ||
        item.remainingRefundableAmount === undefined
      )
        return [];
      return [
        {
          accountCurrency: record.account_currency,
          accountId: record.account_id,
          accountName: record.account_name,
          merchantName: record.merchant_name,
          merchantIconUrl: record.merchant_icon_url,
          reimbursementAmount:
            item.businessStatus?.offsetComposition.reimbursementAmount ?? "0",
          amount: item.amount,
          categoryName: item.categoryName,
          id: item.id,
          parentCategoryName: item.parentCategoryName,
          refundedAmount: item.refundedAmount ?? "0",
          remainingRefundableAmount: item.remainingRefundableAmount,
          transactionAt: record.transaction_at,
          transactionRecordId: record.id,
        },
      ];
    }),
  );
}

/** 已结清或核销结余的原支出仍可选择，金额由用户另行输入。 */
export function getLinkCandidateDefaultAmount(
  candidate: TransactionRefundCandidate,
) {
  return Number(candidate.remainingRefundableAmount) > 0
    ? candidate.remainingRefundableAmount
    : "";
}

/** 数据库核销值加上小票中未保存的关联变更；正在编辑的明细不重复计入。 */
export function adjustLinkCandidate(
  candidate: TransactionRefundCandidate,
  draftItems: readonly {
    id?: number;
    amount: string;
    refundCandidate?: { id: string } | null;
    reimbursementCandidate?: { id: string } | null;
  }[],
  initialItems: readonly {
    amount: string;
    refundCandidate?: { id: string } | null;
    reimbursementCandidate?: { id: string } | null;
  }[],
  editingItemId: number | null = null,
): TransactionRefundCandidate {
  let refunded = toRefundMinorUnits(candidate.refundedAmount) ?? 0n;
  let reimbursed = toRefundMinorUnits(candidate.reimbursementAmount ?? "0") ?? 0n;
  let remaining = toSignedLinkMinorUnits(candidate.remainingRefundableAmount) ?? 0n;
  const apply = (
    items: readonly {
      amount: string;
      refundCandidate?: { id: string } | null;
      reimbursementCandidate?: { id: string } | null;
    }[],
    sign: bigint,
  ) => {
    for (const item of items) {
      const amount = toRefundMinorUnits(item.amount);
      if (amount === null || amount < 0n) continue;
      if (item.refundCandidate?.id === candidate.id) {
        refunded += sign * amount;
        remaining -= sign * amount;
      }
      if (item.reimbursementCandidate?.id === candidate.id) {
        reimbursed += sign * amount;
        remaining -= sign * amount;
      }
    }
  };
  apply(initialItems, -1n);
  apply(draftItems.filter((item) => item.id !== editingItemId), 1n);
  return {
    ...candidate,
    refundedAmount: formatRefundMinorUnits(refunded),
    reimbursementAmount: formatRefundMinorUnits(reimbursed),
    remainingRefundableAmount: formatRefundMinorUnits(remaining),
  };
}

/** 剩余可为负（核销结余），普通金额解析器仅接受非负数。 */
function toSignedLinkMinorUnits(value: string): bigint | null {
  const text = value.trim();
  const negative = text.startsWith("-");
  const units = toRefundMinorUnits(negative ? text.slice(1) : text);
  return units === null ? null : negative ? -units : units;
}
