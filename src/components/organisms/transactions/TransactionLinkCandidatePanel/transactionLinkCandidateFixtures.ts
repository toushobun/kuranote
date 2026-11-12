import type {
  TransactionListItem,
  TransactionRefundCandidate,
  TransactionTimeGroupViewData,
} from "types/transactions";

const summary = {
  balance: "-7820",
  currency: "JPY",
  expense: "7820",
  income: "0",
};
export const candidateRecords: TransactionListItem[] = [
  ["USB-C 充电器", "3280", "0", "2026-11-08T09:00:00Z"],
  ["咖啡豆 2 袋", "2960", "0", "2026-11-02T09:00:00Z"],
  ["收纳盒", "1580", "500", "2026-10-27T09:00:00Z"],
].map(([name, amount, refunded, date], index) => ({
  id: `record-${index}`,
  type: "expense",
  transaction_at: date,
  created_at: date,
  amount,
  account_name: index === 2 ? "现金" : "乐天信用卡",
  account_currency: "JPY",
  categoryItems: [
    {
      id: `item-${index}`,
      amount,
      categoryName: name,
      categoryType: "expense",
      parentCategoryName: "购物",
      refundedAmount: refunded,
      remainingRefundableAmount: String(Number(amount) - Number(refunded)),
    },
  ],
  merchant_name: "Amazon",
  merchant_icon_url: null,
  note: null,
  recorder_name: null,
}));
export const candidateView: TransactionTimeGroupViewData = {
  groupBy: "month",
  groups: [
    {
      id: "november",
      key: "2026-11",
      label: "2026年11月",
      summary,
      transactionCount: 3,
    },
  ],
  initialDateGroupsByGroupId: {
    november: [
      { date: "2026-11-08", label: "11/08", summary, items: candidateRecords },
    ],
  },
  initialExpandedGroupId: "november",
  initialNextItemOffsetByGroupId: { november: null },
  nextOffset: null,
};
export const emptyCandidateView: TransactionTimeGroupViewData = {
  ...candidateView,
  groups: [],
  initialDateGroupsByGroupId: {},
  initialExpandedGroupId: null,
  initialNextItemOffsetByGroupId: {},
};
export const loadCandidateView = async () => candidateView;
export const loadFallbackCandidateView = async (merchantId?: string) =>
  merchantId ? emptyCandidateView : candidateView;
export const loadCandidateSearch = async (query: string) => ({
  items: candidateRecords.filter(
    (item) =>
      item.categoryItems.some((category) =>
        category.categoryName.includes(query),
      ) || item.merchant_name?.includes(query),
  ),
  nextOffset: null,
  totalCount: 3,
});
export const selectedCandidate: TransactionRefundCandidate = {
  id: "item-0",
  amount: "3280",
  accountCurrency: "JPY",
  accountName: "乐天信用卡",
  merchantName: "Amazon",
  categoryName: "USB-C 充电器",
  parentCategoryName: "购物",
  refundedAmount: "0",
  remainingRefundableAmount: "3280",
  transactionAt: candidateRecords[0].transaction_at,
  transactionRecordId: "record-0",
};

export const reimbursementView: TransactionTimeGroupViewData = {
  ...candidateView,
  initialDateGroupsByGroupId: {
    november: [
      {
        ...candidateView.initialDateGroupsByGroupId.november[0],
        items: candidateRecords.map((record, index) => ({
          ...record,
          categoryItems: record.categoryItems.map((item) => ({
            ...item,
            businessStatus: {
              incomeLinkRole: null,
              settlementStatus: "pendingReimbursement",
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: index === 2 ? "500" : "0",
              },
            },
          })),
        })),
      },
    ],
  },
};
export const loadReimbursementView = async () => reimbursementView;
