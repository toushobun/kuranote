import type { ReceiptCreationData } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
} from "./accountHolders";
export const createdMerchant = {
  id: "new-merchant",
  name: "新商家",
  icon_url: null,
  tags: [],
};
export const createdAccount = {
  id: "new-account",
  name: "新账户",
  currency: "JPY",
  type: "cash" as const,
  holders: [{ display_name: "我" }],
};
export function receiptCreationData(
  overrides: { currency?: string } = {},
): NonNullable<ReceiptCreationData> {
  return {
    merchant: {
      createMerchantAction: async (_state, data) => ({
        createdMerchant: { ...createdMerchant, name: String(data.get("name")) },
      }),
      fetchIconAction: async () => ({}),
      ledgerId: "ledger-1",
      ledgerName: "家庭账本",
      tags: [],
    },
    account: {
      createAccountAction: async (_state, data) => ({
        createdAccount: {
          ...createdAccount,
          currency: overrides.currency ?? String(data.get("currency")),
          name: String(data.get("name")),
        },
      }),
      baseCurrency: "JPY",
      holderOptions: accountHolderOptionsFixture,
      placeholderHolderOptions: accountPlaceholderHolderOptionsFixture,
      ledgerName: "家庭账本",
    },
  };
}

export const receiptCreationPayments = [
  { accountId: "paypay", amount: "300" },
  { accountId: "cash", amount: "500" },
];
