import { redirect } from "next/navigation";

import { accountResultValues, accountsNewHref } from "config/paths";
import { loadAccountsView } from "internal/account/adapter/next/loadAccountsView";
import { getSafeNextPath } from "lib/navigation/safeNextPath";
import {
  AccountsTemplate,
  type AccountSaveResult,
} from "templates/accounts/Accounts";

// 新增账户改为独立页面前，记一笔等入口用 /accounts?create=1 打开新增弹框；旧链接转到新页面。
const legacyCreateDialogParam = "create";

function getAccountSaveResult(
  result: string | undefined,
): AccountSaveResult | null {
  if (result === accountResultValues.archived) return "archived";
  if (result === accountResultValues.created) return "created";
  if (result === accountResultValues.updated) return "updated";
  return null;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    [legacyCreateDialogParam]?: string;
    result?: string;
    returnTo?: string;
  }>;
}) {
  const params = await searchParams;
  if (params[legacyCreateDialogParam] === "1") {
    redirect(accountsNewHref(getSafeNextPath(params.returnTo)));
  }

  const view = await loadAccountsView();

  return (
    <AccountsTemplate
      accounts={view.accounts}
      baseCurrency={view.baseCurrency}
      canManageAccounts={view.canManageAccounts}
      saveResult={getAccountSaveResult(params.result)}
    />
  );
}
