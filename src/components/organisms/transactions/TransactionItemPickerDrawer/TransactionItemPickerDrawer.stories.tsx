import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import type { TransactionCategoryOption } from "types/transactions";
import { transactionLinkMessages } from "utils/transactionMessages";

import type { CategoryPickerGroup } from "../TransactionForm/TransactionForm.types";
import { TransactionItemPickerDrawer } from "./TransactionItemPickerDrawer";

const categoryOptions: TransactionCategoryOption[] = [
  {
    id: "expense-gift",
    name: "份子钱",
    parentId: "expense-social",
    parentName: "人情",
    type: "expense",
  },
  {
    id: "expense-tip",
    name: "小费",
    parentId: "expense-social",
    parentName: "人情",
    type: "expense",
  },
  {
    id: "expense-game",
    name: "游戏",
    parentId: "expense-fun",
    parentName: "玩耍",
    type: "expense",
  },
  {
    id: "income-salary",
    name: "工资收入",
    parentId: "income-fixed",
    parentName: "固定收入",
    type: "income",
  },
];

const categoryGroups: CategoryPickerGroup[] = [
  {
    categories: categoryOptions.slice(0, 2),
    id: "expense-social",
    name: "人情",
  },
  {
    categories: categoryOptions.slice(2, 3),
    id: "expense-fun",
    name: "玩耍",
  },
  {
    categories: categoryOptions.slice(3),
    id: "income-fixed",
    name: "固定收入",
  },
];

const meta = {
  title: "Organisms/Transactions/TransactionItemPickerDrawer",
  component: TransactionItemPickerDrawer,
  args: {
    categoryGroups,
    filteredCategoryOptions: categoryOptions,
    onCategoryToggle: () => undefined,
    onClose: () => undefined,
    onGroupSelect: () => undefined,
    onPickerAdd: () => true,
    onRemoveItem: () => undefined,
    onSpecialStatusChange: () => undefined,
    open: true,
    pickerAmount: "1280",
    pickerCategoryId: "expense-tip",
    pickerErrors: {},
    selectedAccountCurrency: "JPY",
    selectedCategoryGroup: categoryGroups[0],
    pickerSpecialStatus: "pendingReimbursement",
    specialStatusEnabled: true,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TransactionItemPickerDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "选择分类",
};

export const IncomeCategoriesDisabled: Story = {
  name: "多账户支出：收入分类不可选",
  args: { disabledCategoryType: "income", pickerSpecialStatus: null },
};

export const ExpenseCategoriesDisabled: Story = {
  name: "多账户收入：支出分类不可选",
  args: {
    disabledCategoryType: "expense",
    pickerCategoryId: "system-refund",
    pickerMode: "refund",
    pickerSpecialStatus: null,
  },
};

export const RefundLinkNotice: Story = {
  name: "退款明细显示关联提示",
  args: {
    linkNotice: "退款明细必须与收款账户币种一致，请重新选择。",
    pickerCategoryId: "system-refund",
    pickerMode: "refund",
    pickerSpecialStatus: null,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("alert")).toHaveTextContent(
      "退款明细必须与收款账户币种一致，请重新选择。",
    );
  },
};

export const RefundLinkAccountRequiredNotice: Story = {
  name: "未选账户时选择关联候选的提示",
  args: {
    linkNotice: transactionLinkMessages.candidateAccountRequired("refund"),
    pickerCategoryId: "income-salary",
    pickerSpecialStatus: null,
    selectedCategoryGroup: categoryGroups[categoryGroups.length - 1],
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole("alert")).toHaveTextContent(
      "请先选择账户，再选择退款明细。",
    );
  },
};
