"use client";

import { useState } from "react";

import type { AccountHolderSelection } from "molecules/accounts/accountHolderSelection";
import type {
  Account,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
  AccountType,
} from "types/accounts";

import {
  getAccountBalanceAdjustment,
  getAccountEditHolderDefaults,
  isAccountFormDirty,
  type AccountFormValues,
} from "./accountEditValues";
import {
  buildAccountPreviewHolders,
  getAccountPreviewBalance,
} from "./accountPreview";

/**
 * 新增 / 编辑账户表单的输入状态，同时派生顶部预览卡片要显示的内容。
 * 传入 account 时为编辑：以当前值为初始值，余额为目标余额。
 */
export function useAccountForm({
  account,
  defaultCurrency,
  holderOptions,
  placeholderHolderOptions,
}: {
  account: Account | null;
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  placeholderHolderOptions: AccountPlaceholderHolderOption[];
}) {
  const editHolders = account
    ? getAccountEditHolderDefaults({
        account,
        holderOptions,
        placeholderHolderOptions,
      })
    : null;
  const placeholderOptions =
    editHolders?.placeholderOptions ?? placeholderHolderOptions;
  const preservedHolderOptions = editHolders?.preservedHolderOptions ?? [];
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType | null>(account?.type ?? null);
  const [currency, setCurrency] = useState(
    account?.currency ?? defaultCurrency,
  );
  const [balance, setBalance] = useState(
    account ? String(account.current_balance) : "0",
  );
  const [balanceAdjustmentNote, setBalanceAdjustmentNote] = useState("");
  const [holderSelection, setHolderSelection] =
    useState<AccountHolderSelection>(editHolders?.selection ?? null);
  const [initialValues] = useState<AccountFormValues>(() => ({
    balance,
    balanceAdjustmentNote,
    currency,
    holderSelection,
    name,
    type,
  }));

  return {
    balance,
    balanceAdjustment: account
      ? getAccountBalanceAdjustment(balance, account.current_balance)
      : null,
    balanceAdjustmentNote,
    currency,
    holderSelection,
    isDirty: isAccountFormDirty(initialValues, {
      balance,
      balanceAdjustmentNote,
      currency,
      holderSelection,
      name,
      type,
    }),
    name,
    placeholderOptions,
    preservedHolderOptions,
    preview: {
      balance: getAccountPreviewBalance(balance),
      holders: buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions,
        preservedHolderOptions,
        selection: holderSelection,
      }),
    },
    setBalance,
    setBalanceAdjustmentNote,
    setCurrency,
    setHolderSelection,
    setName,
    setType,
    type,
  };
}
