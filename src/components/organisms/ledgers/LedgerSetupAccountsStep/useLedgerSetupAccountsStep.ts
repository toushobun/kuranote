"use client";

import { useState } from "react";

import {
  isLedgerSetupAccountNameTaken,
  ledgerSetupAccountTypes,
  ledgerSetupLimits,
  type LedgerSetupAccountType,
  type LedgerSetupDraftAccount,
} from "internal/ledger";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { useLedgerSetupDraftSave } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupDraftSave";
import type { LedgerSetupProgress } from "types/ledgers";
import { getAccountTypeLabel } from "utils/accounts";

/** 本次会话中的账户行。取消勾选的账户保留在列表中（可重新勾选），保存时只保存勾选的账户。 */
type AccountRow = {
  account: LedgerSetupDraftAccount;
  checked: boolean;
};

/** 同一类型内名称唯一，类型 + 名称可作为行的 key。 */
function getRowKey({ name, type }: LedgerSetupDraftAccount) {
  return `${type}:${name}`;
}

type UseLedgerSetupAccountsStepOptions = Omit<
  LedgerSetupWizardStepProps,
  "progress"
> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupAccountsStep(
  options: UseLedgerSetupAccountsStepOptions,
) {
  const { progress } = options;
  const { draft } = progress.setup;
  const draftSave = useLedgerSetupDraftSave(options);
  const [rows, setRows] = useState<AccountRow[]>(() =>
    draft.accounts.items.map((account) => ({ account, checked: true })),
  );
  const [addSheet, setAddSheet] = useState<{
    open: boolean;
    type: LedgerSetupAccountType;
  }>({ open: false, type: "bank" });

  const accounts = rows.map(({ account }) => account);
  const checkedAccounts = rows
    .filter(({ checked }) => checked)
    .map(({ account }) => account);
  // 列表（含取消勾选的账户）达到上限时不能继续添加，保证保存的账户数不超过上限。
  const limitReached = rows.length >= ledgerSetupLimits.maxAccounts;

  // 服务端判定重名时，在勾选的账户中与其他勾选账户同名的行下方提示。
  function getRowError(account: LedgerSetupDraftAccount, checked: boolean) {
    if (!draftSave.accountNameDuplicateError || !checked) return null;

    const others = checkedAccounts.filter((item) => item !== account);
    return isLedgerSetupAccountNameTaken(others, account)
      ? draftSave.accountNameDuplicateError
      : null;
  }

  function buildDraft(skipped: boolean) {
    return { ...draft, accounts: { items: checkedAccounts, skipped } };
  }

  return {
    addSheet: {
      ...addSheet,
      accounts,
      candidates:
        addSheet.type === "cash"
          ? []
          : (progress.template?.accountCandidates[addSheet.type] ?? []),
      onAdd(account: LedgerSetupDraftAccount) {
        setRows((current) => [...current, { account, checked: true }]);
        setAddSheet((current) => ({ ...current, open: false }));
      },
      onClose() {
        setAddSheet((current) => ({ ...current, open: false }));
      },
    },
    checkedCount: checkedAccounts.length,
    failureState: draftSave.failureState,
    groups: ledgerSetupAccountTypes.map((type) => ({
      label: getAccountTypeLabel(type),
      rows: rows
        .filter(({ account }) => account.type === type)
        .map(({ account, checked }) => ({
          checked,
          error: getRowError(account, checked),
          key: getRowKey(account),
          name: account.name,
        })),
      type,
    })),
    isSaving: draftSave.isSaving,
    limitReached,
    goNext() {
      void draftSave.saveAndGoNext(buildDraft(false));
    },
    // 返回上一步时保留原有的跳过状态，只保存账户的修改。
    goPrevious() {
      void draftSave.saveAndGoPrevious(buildDraft(draft.accounts.skipped));
    },
    // 跳过时保留当前勾选的账户，返回该步骤时可以恢复；完成写入时不创建账户。
    skip() {
      void draftSave.saveAndGoNext(buildDraft(true));
    },
    openAddSheet(type: LedgerSetupAccountType) {
      setAddSheet({ open: true, type });
    },
    toggleRow(key: string) {
      setRows((current) =>
        current.map((row) =>
          getRowKey(row.account) === key
            ? { ...row, checked: !row.checked }
            : row,
        ),
      );
    },
  };
}
