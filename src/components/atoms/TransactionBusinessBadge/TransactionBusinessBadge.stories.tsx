import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransactionBusinessBadge } from "./TransactionBusinessBadge";

const meta = {
  title: "Atoms/TransactionBusinessBadge",
  component: TransactionBusinessBadge,
  args: {
    currency: "JPY",
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "400",
        reimbursementAmount: "600",
      },
      settlementStatus: "reimbursed",
    },
  },
} satisfies Meta<typeof TransactionBusinessBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedOffsetCompleted: Story = {
  name: "已结清且同时包含退款与报销核销",
};

export const MixedOffsetPending: Story = {
  name: "待报销且同时包含退款与报销核销",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "400",
        reimbursementAmount: "300",
      },
      settlementStatus: "pendingReimbursement",
    },
  },
};

export const OrdinaryRefundedExpense: Story = {
  name: "普通支出仅展示退款核销来源",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "1000",
        reimbursementAmount: "0",
      },
      settlementStatus: null,
    },
  },
};

export const ReimbursedOnly: Story = {
  name: "仅报销结清",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "0",
        reimbursementAmount: "1000",
      },
      settlementStatus: "reimbursed",
    },
  },
};

export const RefundedOnly: Story = {
  name: "仅退款结清",
  args: {
    status: {
      incomeLinkRole: null,
      offsetComposition: {
        refundAmount: "1000",
        reimbursementAmount: "0",
      },
      settlementStatus: "reimbursed",
    },
  },
};

export const RefundIncome: Story = {
  name: "退款收入来源",
  args: {
    status: {
      incomeLinkRole: "refund",
      offsetComposition: {
        refundAmount: "0",
        reimbursementAmount: "0",
      },
      settlementStatus: null,
    },
  },
};
