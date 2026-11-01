import Stack from "@mui/material/Stack";

import { accountEditHref } from "config/paths";
import { AccountCard } from "molecules/accounts/AccountCard";
import { EmptyState } from "molecules/ui/EmptyState";
import type { Account } from "types/accounts";

type AccountListProps = {
  accounts: Account[];
  canManageAccounts?: boolean;
  emptyDescription?: string;
  emptyTitle?: string;
};

/** 账户卡片列表：能管理账户时点卡片进入编辑账户页。 */
export function AccountList({
  accounts,
  canManageAccounts = true,
  emptyDescription = "请先新增一个账户。",
  emptyTitle = "还没有账户",
}: AccountListProps) {
  if (accounts.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Stack spacing={0.9}>
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          name={account.name}
          type={account.type}
          currency={account.currency}
          holders={account.holders}
          currentBalance={account.current_balance}
          href={canManageAccounts ? accountEditHref(account.id) : undefined}
        />
      ))}
    </Stack>
  );
}
