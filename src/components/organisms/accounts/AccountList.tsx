import Stack from "@mui/material/Stack";

import { AccountCard } from "molecules/accounts/AccountCard";
import { ArchiveAccountButton } from "molecules/accounts/ArchiveAccountButton";
import { ResultFeedback } from "molecules/ui/ResultFeedback";
import type { ServerAction } from "types/actions";
import type { AccountHolderOption, AccountRow } from "types/accounts";

import { AccountEditForm } from "./AccountEditForm";

type AccountListProps = {
  accounts: AccountRow[];
  archiveAccountAction: ServerAction;
  holderOptions: AccountHolderOption[];
  updateAccountAction: ServerAction;
};

export function AccountList({
  accounts,
  archiveAccountAction,
  holderOptions,
  updateAccountAction,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <ResultFeedback
        surface="card"
        variant="empty"
        title="还没有账户"
        message="请先新增一个账户。"
      />
    );
  }

  return (
    <Stack spacing={2.5} sx={{ mt: 4 }}>
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          name={account.name}
          type={account.type}
          currency={account.currency}
          holders={account.holders}
          initialBalance={account.initial_balance}
          currentBalance={account.current_balance}
          actions={
            <Stack
              component="form"
              action={archiveAccountAction}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              <input name="accountId" type="hidden" value={account.id} />
              <ArchiveAccountButton />
            </Stack>
          }
          footer={
            <AccountEditForm
              account={account}
              holderOptions={holderOptions}
              updateAccountAction={updateAccountAction}
            />
          }
        />
      ))}
    </Stack>
  );
}
