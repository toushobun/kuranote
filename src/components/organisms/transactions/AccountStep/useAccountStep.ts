"use client";
import { useState } from "react";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionAccountOption } from "types/transactions";
import type { AccountStepProps } from "./AccountStep.types";

export function useAccountStep({
  accounts,
  recommendedAccountIds = [],
  selectedAccount,
  hasDetails,
  onSelect,
}: AccountStepProps) {
  const confirm = useConfirmDialog();
  const [busy, setBusy] = useState(false);
  const recommended = recommendedAccountIds.flatMap((id) =>
    accounts.filter((account) => account.id === id),
  );
  const others = accounts.filter(
    (account) => !recommended.some((item) => item.id === account.id),
  );
  async function selectAccount(value: TransactionAccountOption) {
    if (busy) return;
    setBusy(true);
    try {
      if (
        hasDetails &&
        selectedAccount &&
        selectedAccount.currency !== value.currency &&
        !(await confirm({
          title: m.currencyTitle(value.name),
          description: m.currencyDescription(
            selectedAccount.currency,
            value.currency,
          ),
          cancelLabel: m.cancel,
          confirmLabel: m.switch,
        }))
      )
        return;
      onSelect(value);
    } finally {
      setBusy(false);
    }
  }
  return { recommended, others, busy, selectAccount };
}
