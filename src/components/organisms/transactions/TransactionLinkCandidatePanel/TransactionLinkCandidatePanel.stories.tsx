import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import {
  candidateItems,
  loadCandidatePage,
  loadMixedMerchantPage,
  loadReimbursementPage,
  loadMerchantPriorityPage,
  selectedCandidate,
  offPageCandidate,
} from "./transactionLinkCandidateFixtures";
import { TransactionOffsetEntryContext } from "../TransactionOffsetEntry/TransactionOffsetEntry";
import { matchesLinkCandidateScope } from "./transactionLinkCandidateUtils";
import type { TransactionLinkCandidatePageInput } from "types/transactions";
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

export const DraftLockedFirst: Story = {
  name: "退款 · 小票锁定优先于历史商家",
  args: {
    loadPageAction: async (input) => ({
      ...(await loadMerchantPriorityPage(input)),
      historyMerchantIds: ["amazon"],
    }),
    lockedAmounts: new Map([[selectedCandidate.id, "200"]]),
  },
};

const groupedItems = [
  { ...candidateItems[0], merchantId: "lawson", merchantName: "罗森" },
  { ...candidateItems[1], merchantId: "amazon", merchantName: "Amazon" },
  { ...candidateItems[2], merchantId: "family", merchantName: "全家" },
  { ...candidateItems[3], merchantId: "amazon", merchantName: "Amazon" },
];
const loadGroupedPage = async (input: TransactionLinkCandidatePageInput) => {
  const matched = groupedItems.filter(
    (item) =>
      matchesLinkCandidateScope(item, input.currency, input.query ?? "") &&
      (input.settled
        ? Number(item.remainingRefundableAmount) <= 0
        : Number(item.remainingRefundableAmount) > 0),
  );
  const offset = input.offset ?? 0;
  return {
    items: matched.slice(offset, offset + 20),
    nextOffset: offset + 20 < matched.length ? offset + 20 : null,
    settledCount: groupedItems.filter(
      (item) =>
        matchesLinkCandidateScope(item, input.currency, input.query ?? "") &&
        Number(item.remainingRefundableAmount) <= 0,
    ).length,
    historyMerchantIds: ["lawson"],
    ...(offset === 0
      ? { groupCounts: { history: 1, sameMerchant: 1, other: 1 } }
      : {}),
  };
};

export const GroupedRefund: Story = {
  name: "方案 A · 退款 · 历史 / 同商家 / 其他 / 已结清",
  args: {
    loadPageAction: loadGroupedPage,
  },
};

export const GroupedReimbursement: Story = {
  name: "方案 A · 报销 · 历史与其他待报销",
  args: {
    kind: "reimbursement",
    merchantId: "amazon",
    loadPageAction: async (input) => {
      const page = await loadGroupedPage(input);
      return {
        ...page,
        groupCounts: { history: 1, sameMerchant: 0, other: 2 },
      };
    },
  },
};

export const GroupedEntryAndLocked: Story = {
  name: "方案 A · 入口 B + 已在小票上",
  args: {
    lockedAmounts: new Map([[groupedItems[0].id, "200"]]),
    loadPageAction: loadGroupedPage,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <TransactionOffsetEntryContext.Provider
        value={{
          kind: "refund",
          merchantId: "amazon",
          accountId: "credit",
          candidates: [groupedItems[2]],
        }}
      >
        <TransactionLinkCandidatePanel
          {...args}
          value={value}
          onChange={setValue}
        />
      </TransactionOffsetEntryContext.Provider>
    );
  },
};

export const GroupedSearchFlat: Story = {
  name: "方案 A · 搜索结果平铺",
  args: { loadPageAction: loadGroupedPage },
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("textbox", { name: "搜索原支出" }),
      "全家",
    );
  },
};

export const GroupedSingleGroup: Story = {
  name: "方案 A · 只有一个可选组",
  args: {
    loadPageAction: async (input) => ({
      items: input.settled ? [] : [candidateItems[0]],
      nextOffset: null,
      settledCount: 0,
      groupCounts: { history: 0, sameMerchant: 1, other: 0 },
    }),
  },
};
