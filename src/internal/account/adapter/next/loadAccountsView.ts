import { notFound, redirect } from "next/navigation";

import { routePaths } from "config/paths";
import { canManageMasterData, canWriteTransaction } from "internal/ledger";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { isUuid } from "utils/formData";

/** 账户页面 SSR 入口。直接复用 Account Service，不请求自身 API。 */
export async function loadAccountsView() {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const dependencies = await createServerRequestDependencies();

  return createRequestContainer(dependencies).account.service.getView({
    ledgerId: currentLedger.id,
    userId,
  });
}

/** 编辑账户页需要完整视图；只允许有账户管理权限的成员访问。 */
async function loadManageableAccountsView() {
  const view = await loadAccountsView();
  if (!view.canManageAccounts) redirect(routePaths.accounts);

  return view;
}

function pickAccountFormView(
  view: Awaited<ReturnType<typeof loadManageableAccountsView>>,
) {
  return {
    baseCurrency: view.baseCurrency,
    canWriteTransactions: view.canWriteTransactions,
    holderOptions: view.holderOptions,
    ledgerName: view.ledgerName,
    placeholderHolderOptions: view.placeholderHolderOptions,
  };
}

/** 新增账户页面 SSR 入口。 */
export async function loadAccountCreateView() {
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  if (!canManageMasterData(currentLedger.currentUserRole))
    redirect(routePaths.accounts);

  const dependencies = await createServerRequestDependencies();
  const formOptions = await createRequestContainer(
    dependencies,
  ).account.service.getCreateFormOptions({
    ledgerId: currentLedger.id,
    userId,
  });

  return {
    baseCurrency: currentLedger.baseCurrency,
    canWriteTransactions: canWriteTransaction(currentLedger.currentUserRole),
    ledgerName: currentLedger.name,
    ...formOptions,
  };
}

/** 编辑账户页面 SSR 入口：当前账本里没有这个使用中的账户时显示 404。 */
export async function loadAccountEditView(accountId: string) {
  if (!isUuid(accountId)) notFound();

  const view = await loadManageableAccountsView();
  const account = view.accounts.find(({ id }) => id === accountId);
  if (!account) notFound();

  return { ...pickAccountFormView(view), account };
}
