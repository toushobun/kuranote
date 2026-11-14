import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import {
  loadCandidatePage,
  loadMixedMerchantPage,
  loadReimbursementPage,
  loadMerchantPriorityPage,
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
export const RefundWithoutAccount: Story = {
  name: "退款 · 未选收款账户",
  args: { accountCurrency: undefined },
};
export const RefundMerchantFirst: Story = {
  name: "退款 · 同商家优先 · 包含其他商家",
  args: { loadPageAction: loadMerchantPriorityPage },
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

export const PartiallyAndFullySettled: Story = {
  name: "退款 · 部分与全额核销候选",
};

export const SettledCollapsed: Story = {
  name: "已结清 · 默认收起",
};
export const SettledExpanded: Story = {
  name: "已结清 · 展开后显示候选",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "已结清的支出（1 笔）" }),
    );
  },
};
export const SettledSearch: Story = {
  name: "已结清 · 搜索结果中展开",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "搜索原支出" }),
      "外套",
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "已结清的支出（1 笔）" }),
    );
  },
};
