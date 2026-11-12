import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import {
  loadCandidatePage,
  loadMixedMerchantPage,
  loadReimbursementPage,
  loadFallbackCandidatePage,
  selectedCandidate,
  offPageCandidate,
} from "./transactionLinkCandidateFixtures";
const meta = {
  title: "Organisms/Transactions/TransactionLinkCandidatePanel",
  component: TransactionLinkCandidatePanel,
  args: {
    accountCurrency: "JPY",
    kind: "refund",
    merchantId: "amazon",
    merchantName: "Amazon",
    loadPageAction: loadCandidatePage,
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
  args: { loadPageAction: loadFallbackCandidatePage },
};
export const Reimbursement: Story = {
  name: "报销 · 已选原支出",
  args: {
    kind: "reimbursement",
    loadPageAction: loadReimbursementPage,
    merchantId: undefined,
    value: selectedCandidate,
  },
};

export const EditOffPageSelection: Story = {
  name: "编辑 · 已关联原支出不在首页",
  args: { value: offPageCandidate },
};

export const MultipleMerchants: Story = {
  name: "报销 · 多商家同名明细",
  args: { kind: "reimbursement", loadPageAction: loadMixedMerchantPage },
};
