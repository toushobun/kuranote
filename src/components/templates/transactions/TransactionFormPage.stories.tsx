import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  EditTransferTransactionTemplate,
  NewTransactionTemplate,
  NewTransferTransactionTemplate,
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
  multiAccountPaymentEnabled: true,
  transactionItemSpecialStatusEnabled: true,
};

// 编辑转账默认可编辑、可删除；只读详情的 Story 覆盖 editRestriction / canDelete。
// 普通记录的编辑见 EditTransactionReceipt 的 Story（#962）。
const editArgs = {
  accountOptions,
  action: noopAction,
  canDelete: true,
  deleteAction: noopAction,
  editRestriction: null,
};

const transferEditInitialValues = {
  accountId: "00000000-0000-4000-8000-000000000045",
  note: "转账编辑示例",
  transactionAt: "2026-06-05T03:20:10.000Z",
  transactionRecordId: "00000000-0000-4000-8000-000000009003",
  transferAmount: "5000",
  transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
  type: "transfer" as const,
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
  name: "标准记账（带切换方式）",
};

export const NewTransfer: Story = {
  name: "账户周转",
  render: (args) => (
    <NewTransferTransactionTemplate
      accountOptions={args.accountOptions}
      action={args.action}
    />
  ),
};

export const WithError: Story = {
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。",
  },
};

export const PermissionDenied: Story = {
  name: "无新增权限",
  render: () => <TransactionPermissionDenied />,
};

export const EmptyOptions: Story = {
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: [],
  },
};

export const EditTransfer: Story = {
  name: "编辑转账",
  render: () => (
    <EditTransferTransactionTemplate
      {...editArgs}
      initialValues={transferEditInitialValues}
    />
  ),
};

export const ReadOnlyTransferPermission: Story = {
  name: "只读详情：他人创建的转账",
  render: () => (
    <EditTransferTransactionTemplate
      {...editArgs}
      canDelete={false}
      editRestriction="permission"
      initialValues={transferEditInitialValues}
    />
  ),
};

export const ReadOnlyTransferArchivedAccount: Story = {
  name: "只读详情：转账账户已归档（可删除）",
  render: () => (
    <EditTransferTransactionTemplate
      {...editArgs}
      editRestriction="archivedAccount"
      initialValues={transferEditInitialValues}
    />
  ),
};
