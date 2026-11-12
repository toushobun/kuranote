import type { TransactionListItem } from "internal/transaction/service/read/transactionReadModels";
import type { TransactionRefundCandidate } from "internal/transaction/entity/transactionReadModels";

/** 把候选记录展开成原支出明细；服务端分页与搜索展示共用相同转换。 */
export function toTransactionLinkCandidates(
  items: TransactionListItem[],
  primaryAccountIdByRecordId?: ReadonlyMap<string, string>,
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
          accountId: primaryAccountIdByRecordId?.get(record.id),
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
