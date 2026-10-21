import type { ComponentProps } from "react";

import type { TransactionAccountOption } from "types/transactions";

import type { TransactionPaymentFields } from "./TransactionPaymentFields";
import {
  reconcileTransactionPayments,
  type TransactionPaymentRow,
} from "./useTransactionPaymentFields";

// TransactionPaymentFields 的测试与 Storybook 共用：「礼品卡 + 信用卡」的 Amazon 3,500 円。
export const paymentFieldsAccountOptions: TransactionAccountOption[] = [
  {
    currency: "JPY",
    id: "00000000-0000-4000-8000-000000000061",
    name: "礼品卡",
  },
  {
    currency: "JPY",
    id: "00000000-0000-4000-8000-000000000062",
    name: "信用卡",
  },
  {
    currency: "USD",
    id: "00000000-0000-4000-8000-000000000063",
    name: "美元卡",
  },
];

const [giftCard, creditCard] = paymentFieldsAccountOptions;

/** 第三个 JPY 账户：用于「付款行未达到同币种账户数量」的场景。 */
export const paymentFieldsCashAccount: TransactionAccountOption = {
  currency: "JPY",
  id: "00000000-0000-4000-8000-000000000064",
  name: "现金",
};

const paymentFieldsItemAmounts = ["3500"];

export function createPaymentFieldsProps({
  itemAmounts = paymentFieldsItemAmounts,
  payments,
  ...overrides
}: Partial<ComponentProps<typeof TransactionPaymentFields>> & {
  itemAmounts?: string[];
}): ComponentProps<typeof TransactionPaymentFields> {
  const rows = payments ?? [{ accountId: giftCard!.id, amount: "", key: 1 }];
  return {
    accountOptions: paymentFieldsAccountOptions,
    multiAccountPaymentEnabled: true,
    onAccountChange: () => undefined,
    onAddPayment: () => undefined,
    onAmountChange: () => undefined,
    onAmountCommit: () => undefined,
    onRemovePayment: () => undefined,
    payments: rows,
    reconciliation: reconcileTransactionPayments({
      currency: "JPY",
      itemAmounts,
      payments: rows,
    }),
    showEmptyAccountHelper: false,
    ...overrides,
  };
}

export function createPaymentRows(
  amounts: [giftCardAmount: string, creditCardAmount: string],
): TransactionPaymentRow[] {
  return [
    { accountId: giftCard!.id, amount: amounts[0], key: 1 },
    { accountId: creditCard!.id, amount: amounts[1], key: 2 },
  ];
}
