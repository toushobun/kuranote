import { notFound, redirect } from "next/navigation";

import { routePaths } from "config/paths";
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

/** 新增 / 编辑账户页面共用：只给能管理账户的成员，其他成员回到账户管理页。 */
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
  return pickAccountFormView(await loadManageableAccountsView());
}

/** 编辑账户页面 SSR 入口：当前账本里没有这个使用中的账户时显示 404。 */
export async function loadAccountEditView(accountId: string) {
  if (!isUuid(accountId)) notFound();

  const view = await loadManageableAccountsView();
  const account = view.accounts.find(({ id }) => id === accountId);
  if (!account) notFound();

  return { ...pickAccountFormView(view), account };
}
