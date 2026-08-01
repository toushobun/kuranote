import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import type { TransactionCategoryOption } from "types/transactions";

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
    onAmountChange: () => undefined,
    onCategoryToggle: () => undefined,
    onClose: () => undefined,
    onGroupSelect: () => undefined,
    onPickerAdd: () => true,
    onRemoveItem: () => undefined,
    open: true,
    pickerAmount: "1280",
    pickerCategoryId: "expense-tip",
    pickerErrors: {},
    selectedAccountCurrency: "JPY",
    selectedCategoryGroup: categoryGroups[0],
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TransactionItemPickerDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  name: "分类列表收起态",
};

export const Expanded: Story = {
  name: "分类列表展开态",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("button", { name: "选择更多分类" }),
    );
  },
};
