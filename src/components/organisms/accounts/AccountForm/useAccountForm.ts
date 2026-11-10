"use client";

import type { WebsiteIconStateAction } from "types/actions";
import { useRef, useState } from "react";

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
  isSameBalanceText,
  type AccountFormValues,
} from "./accountEditValues";

/**
 * 新增 / 编辑账户表单的输入状态。
 * 传入 account 时为编辑：以当前值为初始值，余额为目标余额。
 */
export function useAccountForm({
  account,
  defaultCurrency,
  holderOptions,
  placeholderHolderOptions,
  fetchIconAction,
}: {
  account: Account | null;
  fetchIconAction?: WebsiteIconStateAction;
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
  const [websiteUrl, setWebsiteUrl] = useState(account?.website_url ?? "");
  const [iconUrl, setIconUrl] = useState(account?.icon_url ?? "");
  const [iconTouched, setIconTouched] = useState(false);
  const [iconStatus, setIconStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(iconUrl ? "success" : "idle");
  const [iconError, setIconError] = useState<string>();
  const iconRequest = useRef(0);

  function clearIcon() {
    iconRequest.current += 1;
    setIconTouched(true);
    setIconUrl("");
    setIconStatus("idle");
    setIconError(undefined);
  }

  async function fetchIcon() {
    if (!fetchIconAction) return;
    const request = ++iconRequest.current;
    setIconStatus("loading");
    setIconError(undefined);
    const data = new FormData();
    data.set("websiteUrl", websiteUrl);
    let result: Awaited<ReturnType<WebsiteIconStateAction>>;
    try {
      result = await fetchIconAction({}, data);
    } catch {
      result = {};
    }
    if (request !== iconRequest.current) return;

    const nextIcon = result.error ? "" : (result.iconUrl ?? "");
    if (nextIcon !== iconUrl) setIconTouched(true);
    setIconUrl(nextIcon);
    setIconStatus(nextIcon ? "success" : "error");
    setIconError(result.error);
  }

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType | null>(account?.type ?? null);
  const [currency, setCurrency] = useState(
    account?.currency ?? defaultCurrency,
  );
  const currentBalanceText = account ? String(account.current_balance) : "0";
  const [balance, setBalance] = useState(currentBalanceText);
  const [balanceAdjustmentNote, setBalanceAdjustmentNote] = useState("");
  const [holderSelection, setHolderSelection] =
    useState<AccountHolderSelection>(editHolders?.selection ?? null);
  const [initialValues] = useState<AccountFormValues>(() => ({
    balance,
    currency,
    holderSelection,
    name,
    type,
  }));
  // 页面停留期间账户余额被外部改变（例如刷新后收到新的 props）时，以最新余额为基准：
  // 用户没改过余额就跟着更新，避免拿旧余额算出差值、误提交余额调整；改过的目标余额保留。
  const [balanceBaseline, setBalanceBaseline] = useState(currentBalanceText);
  if (currentBalanceText !== balanceBaseline) {
    setBalanceBaseline(currentBalanceText);
    if (isSameBalanceText(balanceBaseline, balance)) {
      setBalance(currentBalanceText);
      setBalanceAdjustmentNote("");
    }
  }

  return {
    websiteUrl,
    iconUrl,
    iconStatus,
    clearIcon,
    fetchIcon,
    iconError,
    changeWebsiteUrl: (value: string) => {
      setWebsiteUrl(value);
      clearIcon();
    },
    balance,
    balanceAdjustment: account
      ? getAccountBalanceAdjustment(balance, account.current_balance)
      : null,
    balanceAdjustmentNote,
    currency,
    holderSelection,
    isDirty:
      iconTouched ||
      isAccountFormDirty(
        { ...initialValues, balance: balanceBaseline },
        {
          balance,
          currency,
          holderSelection,
          name,
          type,
        },
      ),
    name,
    placeholderOptions,
    preservedHolderOptions,
    setBalance,
    setBalanceAdjustmentNote,
    setCurrency,
    setHolderSelection,
    setName,
    setType,
    type,
  };
}
