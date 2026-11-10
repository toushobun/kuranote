import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { accountsNewHref, transactionsNewEntryHref } from "config/paths";

import { TransactionSetupHintCard } from "./TransactionSetupHintCard";
import {
  getTransferTransactionSetupHint,
  type TransactionSetupHint,
} from "./transactionSetupHint";

function requireHint(hint: TransactionSetupHint | null) {
  if (!hint) throw new Error("hint is required");
  return hint;
}

const meta = {
  title: "Organisms/Transactions/TransactionSetupHintCard",
  component: TransactionSetupHintCard,
  args: {
    addAccountHref: accountsNewHref(
      transactionsNewEntryHref({ method: "transfer" }),
    ),
    hint: requireHint(getTransferTransactionSetupHint(0)),
  },
} satisfies Meta<typeof TransactionSetupHintCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TransferNoAccount: Story = {
  name: "转账 · 没有账户",
};

export const TransferOneAccount: Story = {
  name: "转账 · 只有 1 个账户",
  args: {
    hint: requireHint(getTransferTransactionSetupHint(1)),
  },
};
