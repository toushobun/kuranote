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

export const WithTags: Story = {
  args: {
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000045", amount: null },
      ],
      items: [
        {
          amount: "1200",
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "记账示例",
      transactionAt: "2026-06-05T03:20:10.000Z",
      type: "expense",
    },
  },
};

export const CustomDateTime: Story = {
  args: {
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000046", amount: null },
      ],
      items: [
        {
          amount: "980",
          categoryId: "00000000-0000-4000-8000-000000005073",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001002",
      note: "自定义发生时间示例",
      transactionAt: "2026-06-01T12:34:56.000Z",
      type: "expense",
    },
  },
};

export const EditMode: Story = {
  args: {
    formId: "edit-transaction-form",
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000045", amount: null },
      ],
      items: [
        {
          amount: "1200",
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
        {
          amount: "0",
          categoryId: "00000000-0000-4000-8000-000000005073",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "编辑前已有备注",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009001",
      type: "expense",
    },
    submitLabel: "保存修改",
    title: "编辑记账",
  },
};

export const EditIncomeMode: Story = {
  args: {
    formId: "edit-transaction-form",
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000046", amount: null },
      ],
      items: [
        {
          amount: "300000",
          categoryId: "00000000-0000-4000-8000-000000005074",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001002",
      note: "编辑前已有收入备注",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009002",
      type: "income",
    },
    submitLabel: "保存修改",
    title: "编辑记账",
  },
};

export const MultiAccountPayment: Story = {
  name: "多账户付款（收入分类不可选）",
  args: {
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000045", amount: "800" },
        { accountId: "00000000-0000-4000-8000-000000000046", amount: "400" },
      ],
      items: [
        {
          amount: "1200",
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      type: "expense",
    },
  },
};

export const AddPaymentWithIncomeItem: Story = {
  name: "含收入明细时添加付款账户（确认删除收入明细）",
  args: {
    multiAccountPaymentEnabled: true,
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000045", amount: null },
      ],
      items: [
        {
          amount: "1200",
          categoryId: "00000000-0000-4000-8000-000000005072",
        },
        {
          amount: "300",
          categoryId: "00000000-0000-4000-8000-000000005074",
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      type: "expense",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "添加付款账户" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole("dialog", { name: "删除收入明细？" }),
    ).toBeInTheDocument();
  },
};

const usdAccount = {
  id: "00000000-0000-4000-8000-000000000047",
  name: "美元账户",
  currency: "USD",
};

export const EditIncomeWithSavedRefundLink: Story = {
  name: "编辑已保存退款关联的收入并切换为其他币种账户",
  args: {
    accountOptions: [...accountOptions, usdAccount],
    formId: "edit-transaction-form",
    initialValues: {
      payments: [
        { accountId: "00000000-0000-4000-8000-000000000045", amount: null },
      ],
      items: [
        {
          amount: "500",
          // 与编辑页加载器一致：已关联退款的收入带业务状态，显示「退款收入」标记
          businessNetAmount: "0",
          businessStatus: {
            incomeLinkRole: "refund",
            offsetComposition: { refundAmount: "0", reimbursementAmount: "0" },
            settlementStatus: null,
          },
          categoryId: "00000000-0000-4000-8000-000000005074",
          expectedUpdatedAt: "2026-06-05T03:20:10.000Z",
          id: "00000000-0000-4000-8000-000000008001",
          refundCandidate: {
            accountCurrency: "JPY",
            amount: "1200",
            categoryName: "餐饮",
            id: "00000000-0000-4000-8000-000000008002",
            parentCategoryName: "食材/调料",
            refundedAmount: "500",
            remainingRefundableAmount: "700",
            transactionAt: "2026-06-01T03:20:10.000Z",
            transactionRecordId: "00000000-0000-4000-8000-000000009004",
          },
        },
      ],
      merchantId: "00000000-0000-4000-8000-000000001001",
      note: "",
      transactionAt: "2026-06-05T03:20:10.000Z",
      transactionRecordId: "00000000-0000-4000-8000-000000009003",
      type: "income",
    },
    submitLabel: "保存修改",
    title: "编辑记账",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("combobox", { name: "账户" }));
    await userEvent.click(
      await body.findByRole("option", { name: "美元账户（USD）" }),
    );
    await expect(
      await canvas.findByText(
        "该明细已关联退款，账户需与关联明细的币种一致；如需更换为其他币种的账户，请先解除关联。",
      ),
    ).toBeInTheDocument();
    // 切换币种后已保存的退款关联仍被保留
    await expect(canvas.getByText("退款收入")).toBeVisible();
  },
};

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
