import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import {
  EditTransactionTemplate,
  EditTransferTransactionTemplate,
  NewTransactionTemplate,
  TransactionPermissionDenied,
} from "./TransactionFormPage";
import { NewTransactionVisualFrame } from "./NewTransactionVisualFrame";

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
    name: "工资",
    parentId: "00000000-0000-4000-8000-000000005002",
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
    name: "共達",
    icon_url: null,
  },
];

async function noopAction() {
  return {};
}

const baseArgs = {
  accountOptions,
  action: noopAction,
  categoryOptions,
  errorMessage: null,
  frequentCategoryIds: categoryOptions.map((category) => category.id),
  ledgerName: "家庭账本",
  merchantOptions,
  transactionItemSpecialStatusEnabled: true,
};

const meta = {
  title: "Templates/Transactions/TransactionFormPage",
  component: NewTransactionTemplate,
  decorators: [
    (Story) => (
      <NewTransactionVisualFrame>
        <Story />
      </NewTransactionVisualFrame>
    ),
  ],
  args: baseArgs,
} satisfies Meta<typeof NewTransactionTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "新增记账页面",
};

export const WithError: Story = {
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。",
  },
};

export const PermissionDenied: Story = {
  name: "无新增权限",
  render: () => <TransactionPermissionDenied operation="create" />,
};

export const ArchivedAccountPermissionDenied: Story = {
  name: "转账账户已归档",
  render: () => (
    <TransactionPermissionDenied operation="edit" reason="archivedAccount" />
  ),
};

export const EmptyOptions: Story = {
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: [],
  },
};

export const EditExpenseConvert: Story = {
  name: "编辑支出：可切换到转账",
  render: () => (
    <EditTransactionTemplate
      {...baseArgs}
      deleteAction={noopAction}
      initialValues={{
        accountId: "00000000-0000-4000-8000-000000000045",
        items: [
          {
            amount: "1200",
            categoryId: "00000000-0000-4000-8000-000000005072",
          },
        ],
        merchantId: "00000000-0000-4000-8000-000000001001",
        note: "普通交易编辑示例",
        transactionAt: "2026-06-05T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009001",
        type: "expense",
      }}
    />
  ),
};

export const EditIncomeConvert: Story = {
  name: "编辑收入：可切换到转账",
  render: () => (
    <EditTransactionTemplate
      {...baseArgs}
      deleteAction={noopAction}
      initialValues={{
        accountId: "00000000-0000-4000-8000-000000000046",
        items: [
          {
            amount: "260000",
            categoryId: "00000000-0000-4000-8000-000000005073",
          },
        ],
        merchantId: "00000000-0000-4000-8000-000000001002",
        note: "收入交易编辑示例",
        transactionAt: "2026-06-05T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009002",
        type: "income",
      }}
    />
  ),
};

export const EditTransferConvert: Story = {
  name: "编辑记账：转账类型可切换到支出或收入",
  render: () => (
    <EditTransferTransactionTemplate
      {...baseArgs}
      deleteAction={noopAction}
      initialValues={{
        accountId: "00000000-0000-4000-8000-000000000045",
        note: "转账编辑示例",
        transactionAt: "2026-06-05T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009003",
        transferAmount: "5000",
        transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
        type: "transfer",
      }}
    />
  ),
};

export const EditLinkedExpense: Story = {
  name: "编辑已关联支出：可编辑并显示核销结余",
  render: () => (
    <EditTransactionTemplate
      {...baseArgs}
      deleteAction={noopAction}
      initialValues={{
        accountId: "00000000-0000-4000-8000-000000000045",
        items: [
          {
            amount: "1200",
            businessNetAmount: "-300",
            businessStatus: {
              incomeLinkRole: null,
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: "1500",
              },
              settlementStatus: "reimbursementSurplus",
            },
            categoryId: "00000000-0000-4000-8000-000000005072",
            expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
            id: "00000000-0000-4000-8000-000000008001",
            specialStatus: "reimbursementSurplus",
          },
        ],
        merchantId: "00000000-0000-4000-8000-000000001001",
        note: "已有关联但仍可修正",
        transactionAt: "2026-08-20T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009004",
        type: "expense",
      }}
    />
  ),
};

export const LinkedDeleteForbidden: Story = {
  name: "删除仍被子项关联的母项被拒绝",
  render: () => (
    <EditTransactionTemplate
      {...baseArgs}
      deleteAction={async () => ({
        error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
        errorKey: "linked_delete_forbidden",
      })}
      initialValues={{
        accountId: "00000000-0000-4000-8000-000000000045",
        items: [
          {
            amount: "1200",
            businessStatus: {
              incomeLinkRole: null,
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: "1200",
              },
              settlementStatus: "reimbursed",
            },
            categoryId: "00000000-0000-4000-8000-000000005072",
            expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
            id: "00000000-0000-4000-8000-000000008001",
            specialStatus: "reimbursed",
          },
        ],
        merchantId: "00000000-0000-4000-8000-000000001001",
        note: "删除前需要解除关联",
        transactionAt: "2026-08-20T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009005",
        type: "expense",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "删除" }));
    await userEvent.click(
      await within(document.body).findByRole("button", { name: "删除" }),
    );
    await within(document.body).findByText("无法删除已关联明细");
  },
};

export const LinkedIncomeDeleteConfirmation: Story = {
  name: "删除关联收入时提示自动解除关联",
  render: () => (
    <EditTransactionTemplate
      {...baseArgs}
      deleteAction={noopAction}
      initialValues={{
        accountId: "00000000-0000-4000-8000-000000000045",
        items: [
          {
            amount: "1200",
            businessStatus: {
              incomeLinkRole: "reimbursement",
              offsetComposition: {
                refundAmount: "0",
                reimbursementAmount: "0",
              },
              settlementStatus: null,
            },
            categoryId: "00000000-0000-4000-8000-000000005073",
            expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
            id: "00000000-0000-4000-8000-000000008002",
            specialStatus: null,
          },
        ],
        merchantId: "00000000-0000-4000-8000-000000001001",
        note: "删除时自动解除关联",
        transactionAt: "2026-08-20T03:20:10.000Z",
        transactionRecordId: "00000000-0000-4000-8000-000000009006",
        type: "income",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "删除" }));
    await within(document.body).findByText(
      "删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？",
    );
  },
};
