import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { transactionErrorCodes } from "internal/transaction";
import {
  transactionEntryStoryDecorators,
  receiptCreationStoryDecorator,
} from "organisms/transactions/transactionStepFlowStoryUtils";
import type { TransactionFormInitialValues } from "organisms/transactions/TransactionForm/TransactionForm.types";
import { receiptItemsOptions } from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { EditTransactionReceiptTemplate } from "./EditTransactionReceipt";
import { NewTransactionVisualFrame } from "./NewTransactionVisualFrame";

// 7-Eleven 的午餐 ¥800 + 咖啡 ¥250，用 PayPay 支付。
const initialValues: TransactionFormInitialValues = {
  items: [
    { amount: "800", categoryId: "lunch", specialStatus: null },
    { amount: "250", categoryId: "coffee", specialStatus: null },
  ],
  merchantId: "seven",
  note: "和同事一起",
  payments: [{ accountId: "paypay", amount: null }],
  transactionAt: "2026-10-29T03:20:10.000Z",
  transactionRecordId: "00000000-0000-4000-8000-000000009001",
  type: "expense",
};

// 午餐 ¥1,200 已被另一笔记录报销 ¥1,200，母项不能直接删除。
const reimbursedInitialValues: TransactionFormInitialValues = {
  ...initialValues,
  items: [
    {
      amount: "1200",
      businessNetAmount: "0",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: { refundAmount: "0", reimbursementAmount: "1200" },
        settlementStatus: "reimbursed",
      },
      categoryId: "lunch",
      expectedUpdatedAt: "2026-10-29T03:21:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      reimbursementAmount: "1200",
      specialStatus: "reimbursed",
    },
  ],
};

// Storybook 没有推荐查询 API：快捷金额按读取失败处理（没有快捷金额）。
const meta = {
  title: "Templates/Transactions/EditTransactionReceipt",
  component: EditTransactionReceiptTemplate,
  decorators: [
    ...transactionEntryStoryDecorators,
    receiptCreationStoryDecorator,
    (Story) => (
      <NewTransactionVisualFrame>
        <Story />
      </NewTransactionVisualFrame>
    ),
  ],
  args: {
    accountOptions: flowFixture.accounts,
    action: async () => ({}),
    canDelete: true,
    categoryOptions: receiptItemsOptions.categoryOptions,
    deleteAction: async () => ({}),
    editRestriction: null,
    frequentMerchants: flowFixture.frequentMerchants,
    initialValues,
    ledgerId: "ledger-1",
    merchantOptions: flowFixture.merchants,
    merchantTags: flowFixture.merchantTags,
    multiAccountPaymentEnabled: true,
    transactionItemSpecialStatusEnabled: true,
  },
  parameters: { viewport: { defaultViewport: "mobile2" } },
} satisfies Meta<typeof EditTransactionReceiptTemplate>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "编辑记账（预填小票）" };

export const MultiAccount: Story = {
  name: "多账户付款",
  args: {
    initialValues: {
      ...initialValues,
      payments: [
        { accountId: "paypay", amount: "700" },
        { accountId: "cash", amount: "350" },
      ],
    },
  },
};

export const ChangeMerchant: Story = {
  name: "小票商家抽屉（支持新增商家）",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: "修改商家：7-Eleven",
      }),
    );
  },
};

export const ReadOnlyPermission: Story = {
  name: "只读详情：他人创建的记录",
  args: { canDelete: false, editRestriction: "permission" },
};

export const ReadOnlyArchivedAccount: Story = {
  name: "只读详情：账户已归档（可删除）",
  args: {
    accountOptions: flowFixture.accounts.filter(
      (account) => account.id !== "paypay",
    ),
    archivedAccountOptions: flowFixture.accounts.filter(
      (account) => account.id === "paypay",
    ),
    editRestriction: "archivedAccount",
  },
};

export const LinkedDeleteForbidden: Story = {
  name: "删除仍被子项关联的母项被拒绝",
  args: {
    deleteAction: async () => ({
      error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
      errorCode: transactionErrorCodes.linkedDeleteForbidden,
      errorKey: "storybook-linked-delete-forbidden",
    }),
    initialValues: reimbursedInitialValues,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "删除" }));
    await userEvent.click(
      await within(document.body).findByRole("button", { name: "删除" }),
    );
    await within(document.body).findByText("无法删除已关联明细");
  },
};
