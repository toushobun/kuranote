import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import {
  loadCandidateView,
  loadReimbursementView,
  loadFallbackCandidateView,
  loadCandidateSearch,
  selectedCandidate,
} from "./transactionLinkCandidateFixtures";
const meta = {
  title: "Organisms/Transactions/TransactionLinkCandidatePanel",
  component: TransactionLinkCandidatePanel,
  args: {
    accountCurrency: "JPY",
    kind: "refund",
    merchantId: "amazon",
    merchantName: "Amazon",
    loadInitialViewAction: loadCandidateView,
    loadSearchPageAction: loadCandidateSearch,
    onChange: () => undefined,
    value: null,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <TransactionLinkCandidatePanel
        {...args}
        value={value}
        onChange={setValue}
      />
    );
  },
} satisfies Meta<typeof TransactionLinkCandidatePanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Refund: Story = { name: "退款 · 商家三笔支出 · 未选" };
export const RefundFallback: Story = {
  name: "退款 · 无商家候选回退全部",
  args: { loadInitialViewAction: loadFallbackCandidateView },
};
export const Reimbursement: Story = {
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadInitialViewAction: loadReimbursementView,
    merchantId: undefined,
    value: selectedCandidate,
  },
};
