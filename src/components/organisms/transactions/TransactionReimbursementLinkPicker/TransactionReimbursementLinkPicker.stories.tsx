import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { screen, userEvent, within } from "storybook/test";

import { createTransactionListItem } from "@/test/mocks/transactions";

import { TransactionReimbursementLinkPicker } from "./TransactionReimbursementLinkPicker";

const meta = {
  title: "Organisms/Transactions/TransactionReimbursementLinkPicker",
  component: TransactionReimbursementLinkPicker,
  args: { onChange() {}, value: null },
} satisfies Meta<typeof TransactionReimbursementLinkPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PartialReimbursement: Story = {
  name: "报销金额包含未核销净收益",
  args: {
    incomeAmount: "1500",
    value: {
      accountCurrency: "JPY",
      accountId: "account-1",
      amount: "1200",
      categoryName: "午餐",
      id: "reimbursement-item-1",
      parentCategoryName: "饮食",
      refundedAmount: "200",
      remainingRefundableAmount: "1000",
      transactionAt: "2026-08-15T10:00:00.000Z",
      transactionRecordId: "transaction-1",
    },
  },
};

const reimbursementSearchPage = {
  items: [
    createTransactionListItem({
      account_currency: "JPY",
      categoryItems: [
        {
          accountId: "account-1",
          amount: "1200",
          categoryName: "午餐",
          categoryType: "expense",
          id: "reimbursement-item-1",
          parentCategoryName: "饮食",
          refundedAmount: "200",
          remainingRefundableAmount: "1000",
        },
      ],
    }),
  ],
  nextOffset: null,
  totalCount: 1,
};

export const SingleSelectSearch: Story = {
  name: "搜索单选候选",
  args: {
    incomeAmount: "1000",
    loadSearchPageAction: async () => reimbursementSearchPage,
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择报销明细" }),
    );
    await userEvent.click(await screen.findByRole("tab", { name: "搜索" }));
    await userEvent.type(screen.getByLabelText("搜索关键词"), "午餐{Enter}");
    await screen.findByRole("button", { name: "选择报销明细 午餐" });
  },
};
