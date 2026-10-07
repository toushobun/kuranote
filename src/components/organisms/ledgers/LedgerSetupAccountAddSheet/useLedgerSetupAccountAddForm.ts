"use client";

import { useState, type FormEvent } from "react";

import { ledgerSetupAccountsMessages } from "config/ledgerSetupMessages";
import {
  isLedgerSetupAccountNameTaken,
  ledgerSetupLimits,
  type LedgerSetupAccountType,
  type LedgerSetupDraftAccount,
} from "internal/ledger";

const sheetMessages = ledgerSetupAccountsMessages.addSheet;

export type UseLedgerSetupAccountAddFormOptions = {
  /** 已在列表中的账户（含本次取消勾选的），用于重名判断与候选的已添加标记。 */
  accounts: readonly LedgerSetupDraftAccount[];
  /** 当前类型的候选名称；现金或无模板币种时为空。 */
  candidates: readonly string[];
  onAdd: (account: LedgerSetupDraftAccount) => void;
  type: LedgerSetupAccountType;
};

function getNameError(name: string, isTaken: boolean) {
  if (name.length > ledgerSetupLimits.accountNameMaxLength) {
    return sheetMessages.nameTooLong(ledgerSetupLimits.accountNameMaxLength);
  }

  return isTaken ? sheetMessages.nameDuplicate : null;
}

export function useLedgerSetupAccountAddForm({
  accounts,
  candidates,
  onAdd,
  type,
}: UseLedgerSetupAccountAddFormOptions) {
  const [name, setName] = useState("");
  // 空名称只在提交时提示，避免刚打开弹层就显示错误。
  const [requiredErrorVisible, setRequiredErrorVisible] = useState(false);
  const trimmedName = name.trim();
  // 名称与某个候选一致时视为选中该候选（Chip 高亮，并记录 templateKey）。
  const selectedCandidate =
    candidates.find((candidate) => candidate === trimmedName) ?? null;
  const nameError =
    requiredErrorVisible && trimmedName.length === 0
      ? sheetMessages.nameRequired
      : getNameError(
          trimmedName,
          isLedgerSetupAccountNameTaken(accounts, { name: trimmedName, type }),
        );

  function changeName(value: string) {
    setName(value);
    setRequiredErrorVisible(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmedName.length === 0) {
      setRequiredErrorVisible(true);
      return;
    }

    if (nameError) return;

    onAdd(
      selectedCandidate
        ? { name: trimmedName, templateKey: selectedCandidate, type }
        : { name: trimmedName, type },
    );
  }

  return {
    candidates: candidates.map((candidate) => ({
      added: isLedgerSetupAccountNameTaken(accounts, { name: candidate, type }),
      name: candidate,
      selected: candidate === selectedCandidate,
    })),
    changeName,
    handleSubmit,
    name,
    nameError,
  };
}
