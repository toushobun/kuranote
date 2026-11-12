import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TransactionTimeGroupViewData } from "types/transactions";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";

const emptyView: TransactionTimeGroupViewData = {
  groupBy: "month",
  groups: [],
  initialDateGroupsByGroupId: {},
  initialExpandedGroupId: null,
  initialNextItemOffsetByGroupId: {},
  nextOffset: null,
};
const meta = {
  title: "Organisms/Transactions/TransactionLinkCandidatePanel",
  component: TransactionLinkCandidatePanel,
  args: {
    accountCurrency: "JPY",
    amount: "",
    kind: "refund",
    loadInitialViewAction: async () => emptyView,
    onAmountChange: () => undefined,
    onChange: () => undefined,
    value: null,
  },
} satisfies Meta<typeof TransactionLinkCandidatePanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Refund: Story = { name: "退款 · 待选原支出" };
export const Reimbursement: Story = {
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    amount: "1200",
    value: {
      id: "item-1",
      accountCurrency: "JPY",
      amount: "3000",
      categoryName: "交通费",
      parentCategoryName: "交通",
      refundedAmount: "500",
      remainingRefundableAmount: "2500",
      transactionAt: "2026-11-01T09:00:00Z",
      transactionRecordId: "record-1",
    },
  },
};
