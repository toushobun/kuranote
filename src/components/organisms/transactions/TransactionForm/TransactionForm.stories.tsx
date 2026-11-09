import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  accountsNewHref,
  merchantsNewHref,
  transactionsNewEntryHref,
} from "config/paths";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

import { TransactionForm } from "./TransactionForm";

const accountOptions = [
  {
    id: "00000000-0000-4000-8000-000000000045",
    name: "日元现金",
    currency: "JPY",
  },
  {
    id: "00000000-0000-4000-8000-000000000046",
    name: "三井住友银行",
    currency: "JPY",
  },
];

const categoryOptions = [
  {
    id: "00000000-0000-4000-8000-000000005072",
    name: "餐饮",
    parentId: "00000000-0000-4000-8000-000000005001",
    parentName: "食材/调料",
    type: "expense" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000005073",
    name: "交通",
    parentId: "00000000-0000-4000-8000-000000005002",
    parentName: "交通出行",
    type: "expense" as const,
  },
  {
    id: "00000000-0000-4000-8000-000000005074",
    name: "工资",
    parentId: "00000000-0000-4000-8000-000000005003",
    parentName: "固定收入",
    type: "income" as const,
  },
];

const merchantOptions = [
  {
    id: "00000000-0000-4000-8000-000000001001",
    name: "便利店",
    icon_url: null,
  },
  {
    id: "00000000-0000-4000-8000-000000001002",
    name: "超市",
    icon_url: null,
  },
];

async function noopAction() {}

const meta = {
  title: "Organisms/Transactions/TransactionForm",
  component: TransactionForm,
  args: {
    action: noopAction,
    accountOptions,
    categoryOptions,
    frequentCategoryIds: categoryOptions.map((category) => category.id),
    ledgerName: "家庭账本",
    merchantOptions,
  },
  decorators: [
    (Story) => (
      <ConfirmDialogProvider>
        <Story />
      </ConfirmDialogProvider>
    ),
  ],
} satisfies Meta<typeof TransactionForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    errorMessage: "新增记账失败。请稍后重试。",
  },
};

export const EmptyOptions: Story = {
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: [],
  },
};

const setupHrefs = {
  account: accountsNewHref(
    transactionsNewEntryHref({ method: "standard", type: "expense" }),
  ),
  merchant: merchantsNewHref(
    transactionsNewEntryHref({ method: "standard", type: "expense" }),
  ),
};

export const MissingAccountAndMerchant: Story = {
  name: "缺少账户和商家（提示卡片）",
  args: {
    accountOptions: [],
    merchantOptions: [],
    setupHrefs,
  },
};

export const MissingMerchant: Story = {
  name: "只缺商家（提示卡片）",
  args: {
    merchantOptions: [],
    setupHrefs,
  },
};

export const MissingAccount: Story = {
  name: "只缺账户（提示卡片）",
  args: {
    accountOptions: [],
    setupHrefs,
  },
};

export const MultiAccountIncome: Story = {
  name: "纯收入：添加第二个收款账户",
  args: { initialType: "income", multiAccountPaymentEnabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("combobox", { name: "账户" }));
    await userEvent.click(
      await body.findByRole("option", { name: "日元现金（JPY）" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "添加明细" }));
    await userEvent.click(
      await body.findByRole("button", { name: "固定收入 · 工资" }),
    );
    await userEvent.type(body.getByRole("textbox", { name: "金额" }), "10000");
    await userEvent.click(body.getByRole("button", { name: "确定" }));
    await userEvent.click(body.getByRole("button", { name: "关闭" }));
    await userEvent.click(
      await canvas.findByRole("button", { name: "添加收款账户" }),
    );
    await userEvent.click(canvas.getByRole("combobox", { name: "收款账户 2" }));
    await userEvent.click(
      await body.findByRole("option", { name: "三井住友银行（JPY）" }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "收款合计 ¥10,000 / 明细合计 ¥10,000",
    );
  },
};
