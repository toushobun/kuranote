import type {
  TransactionLinkCandidatePage,
  TransactionLinkCandidatePageInput,
  TransactionRefundCandidate,
} from "types/transactions";
export const candidateItems: TransactionRefundCandidate[] = [
  ["USB-C 充电器", "3280", "0", "2026-11-08T09:00:00Z"],
  ["咖啡豆 2 袋", "2960", "0", "2026-11-02T09:00:00Z"],
  ["收纳盒", "1580", "500", "2026-10-27T09:00:00Z"],
  ["外套", "6000", "6000", "2026-10-20T09:00:00Z"],
].map(([name, amount, refunded, date], index) => ({
  id: `item-${index}`,
  transactionRecordId: `record-${index}`,
  categoryName: name,
  amount,
  refundedAmount: refunded,
  reimbursementAmount: "0",
  remainingRefundableAmount: String(Number(amount) - Number(refunded)),
  accountName: index === 2 ? "现金" : "乐天信用卡",
  accountCurrency: "JPY",
  merchantName: "Amazon",
  transactionAt: date,
  parentCategoryName: "购物",
}));
export const candidatePage: TransactionLinkCandidatePage = {
  items: candidateItems,
  nextOffset: null,
};
export const emptyCandidatePage: TransactionLinkCandidatePage = {
  items: [],
  nextOffset: null,
};
export const selectedCandidate = candidateItems[0];
export const offPageCandidate: TransactionRefundCandidate = {
  ...candidateItems[0],
  id: "old-item",
  transactionRecordId: "old-record",
  categoryName: "往年差旅支出",
  merchantName: "其他商家",
  transactionAt: "2025-01-01T09:00:00Z",
};
function fixturePage(
  items: TransactionRefundCandidate[],
  input: TransactionLinkCandidatePageInput,
): TransactionLinkCandidatePage {
  const matched = items.filter(
    (item) =>
      (!input.currency || item.accountCurrency === input.currency) &&
      (!input.query ||
        item.categoryName.includes(input.query) ||
        item.merchantName?.includes(input.query)),
  );
  const offset = input.offset ?? 0;
  return {
    items: matched.slice(offset, offset + 20),
    nextOffset: offset + 20 < matched.length ? offset + 20 : null,
  };
}
export const loadCandidatePage = async (
  input: TransactionLinkCandidatePageInput,
) => fixturePage(candidateItems, input);
export const loadFallbackCandidatePage = async (
  input: TransactionLinkCandidatePageInput,
) => (input.merchantId ? emptyCandidatePage : loadCandidatePage(input));
export const loadReimbursementPage = async (
  input: TransactionLinkCandidatePageInput,
) =>
  fixturePage(
    candidateItems.map((item, index) => ({
      ...item,
      refundedAmount: "0",
      reimbursementAmount: index === 2 ? "500" : "0",
    })),
    input,
  );

export const mixedMerchantItems: TransactionRefundCandidate[] = candidateItems
  .slice(0, 2)
  .map((item, index) => ({
    ...item,
    categoryName: "餐饮",
    merchantName: index === 0 ? "全家" : "罗森",
    accountName: "招行信用卡",
  }));
export const loadMixedMerchantPage = async (
  input: TransactionLinkCandidatePageInput,
) => fixturePage(mixedMerchantItems, input);
