"use client";

import { useState } from "react";

import type { AccountHolderSelection } from "molecules/accounts/accountHolderSelection";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
  AccountType,
} from "types/accounts";

import {
  buildAccountPreviewHolders,
  getAccountPreviewBalance,
} from "./accountPreview";

/** 新增账户表单的输入状态，同时派生顶部预览卡片要显示的内容。 */
export function useAccountForm({
  defaultCurrency,
  holderOptions,
  placeholderHolderOptions,
}: {
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  placeholderHolderOptions: AccountPlaceholderHolderOption[];
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | null>(null);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [balance, setBalance] = useState("0");
  const [holderSelection, setHolderSelection] =
    useState<AccountHolderSelection>(null);

  return {
    balance,
    currency,
    holderSelection,
    name,
    preview: {
      balance: getAccountPreviewBalance(balance),
      holders: buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions: placeholderHolderOptions,
        selection: holderSelection,
      }),
    },
    setBalance,
    setCurrency,
    setHolderSelection,
    setName,
    setType,
    type,
  };
}
