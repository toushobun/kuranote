import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  accountsCreateHref,
  merchantsNewHref,
  transactionsNewHref,
} from "config/paths";

import { TransactionSetupHintCard } from "./TransactionSetupHintCard";
import {
  getNormalTransactionSetupHint,
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
    addAccountHref: accountsCreateHref(transactionsNewHref("expense")),
    addMerchantHref: merchantsNewHref(transactionsNewHref("expense")),
    hint: requireHint(
      getNormalTransactionSetupHint({ accountCount: 0, merchantCount: 0 }),
    ),
  },
} satisfies Meta<typeof TransactionSetupHintCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MissingAccountAndMerchant: Story = {
  name: "账户、商家都没有",
};

export const MissingMerchant: Story = {
  name: "只缺商家",
  args: {
    hint: requireHint(
      getNormalTransactionSetupHint({ accountCount: 1, merchantCount: 0 }),
    ),
  },
};

export const MissingAccount: Story = {
  name: "只缺账户",
  args: {
    hint: requireHint(
      getNormalTransactionSetupHint({ accountCount: 0, merchantCount: 1 }),
    ),
  },
};

export const TransferOneAccount: Story = {
  name: "转账 · 只有 1 个账户",
  args: {
    addAccountHref: accountsCreateHref(transactionsNewHref("transfer")),
    addMerchantHref: undefined,
    hint: requireHint(getTransferTransactionSetupHint(1)),
  },
};
