import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  EditTransferTransactionTemplate,
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

async function noopAction() {
  return {};
}

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
  component: EditTransferTransactionTemplate,
  decorators: [
    (Story) => (
      <NewTransactionVisualFrame>
        <Story />
      </NewTransactionVisualFrame>
    ),
  ],
  args: { ...editArgs, initialValues: transferEditInitialValues },
} satisfies Meta<typeof EditTransferTransactionTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PermissionDenied: Story = {
  name: "无新增权限",
  render: () => <TransactionPermissionDenied />,
};

export const EditTransfer: Story = { name: "编辑转账" };

export const ReadOnlyTransferPermission: Story = {
  name: "只读详情：他人创建的转账",
  args: { canDelete: false, editRestriction: "permission" },
};

export const ReadOnlyTransferArchivedAccount: Story = {
  name: "只读详情：转账账户已归档（可删除）",
  args: {
    // 转入账户已归档：不在可选账户里，由 archivedAccountOptions 提供名称与币种（#966）。
    accountOptions: accountOptions.slice(0, 1),
    archivedAccountOptions: accountOptions.slice(1),
    editRestriction: "archivedAccount",
  },
};
