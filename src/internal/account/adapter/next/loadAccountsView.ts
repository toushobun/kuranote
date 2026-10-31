import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";

/** 账户页面 SSR 入口。直接复用 Account Service，不请求自身 API。 */
export async function loadAccountsView() {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const dependencies = await createServerRequestDependencies();

  return createRequestContainer(dependencies).account.service.getView({
    ledgerId: currentLedger.id,
    userId,
  });
}

/** 新增账户页面 SSR 入口：只给能管理账户的成员，其他成员回到账户管理页。 */
export async function loadAccountCreateView() {
  const view = await loadAccountsView();
  if (!view.canManageAccounts) redirect(routePaths.accounts);

  return {
    baseCurrency: view.baseCurrency,
    canWriteTransactions: view.canWriteTransactions,
    holderOptions: view.holderOptions,
    ledgerName: view.ledgerName,
    placeholderHolderOptions: view.placeholderHolderOptions,
  };
}
