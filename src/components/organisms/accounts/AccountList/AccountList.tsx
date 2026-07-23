"use client";

import Stack from "@mui/material/Stack";
import { useMemo, useState } from "react";

import { AccountCard } from "molecules/accounts/AccountCard";
import { EmptyState } from "molecules/ui/EmptyState";
import type { AccountSaveResult } from "templates/accounts/Accounts";
import type { AccountHolderOption, AccountRow } from "types/accounts";
import type { ServerAction } from "types/actions";

import { AccountEditDialog } from "../AccountEditDialog/AccountEditDialog";

type AccountListProps = {
  accounts: AccountRow[];
  archiveAccountAction: ServerAction;
  canManageAccounts?: boolean;
  emptyDescription?: string;
  emptyTitle?: string;
  holderOptions: AccountHolderOption[];
  saveResult?: AccountSaveResult | null;
  updateAccountAction: ServerAction;
};

export function AccountList({
  accounts,
  archiveAccountAction,
  canManageAccounts = true,
  emptyDescription = "请先新增一个账户。",
  emptyTitle = "还没有账户",
  holderOptions,
  saveResult = null,
  updateAccountAction,
}: AccountListProps) {
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [previousSaveResult, setPreviousSaveResult] = useState(saveResult);
  const editingAccount = useMemo(
    () => accounts.find((account) => account.id === editingAccountId) ?? null,
    [accounts, editingAccountId],
  );

  if (saveResult !== previousSaveResult) {
    setPreviousSaveResult(saveResult);

    if (saveResult !== null) {
      setEditingAccountId(null);
    }
  }

  if (accounts.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <Stack spacing={0.9}>
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            name={account.name}
            type={account.type}
            currency={account.currency}
            holders={account.holders}
            currentBalance={account.current_balance}
            onClick={
              canManageAccounts
                ? () => setEditingAccountId(account.id)
                : undefined
            }
          />
        ))}
      </Stack>

      {canManageAccounts ? (
        <AccountEditDialog
          account={editingAccount}
          archiveAccountAction={archiveAccountAction}
          holderOptions={holderOptions}
          onClose={() => setEditingAccountId(null)}
          open={editingAccount !== null}
          updateAccountAction={updateAccountAction}
        />
      ) : null}
    </>
  );
}
