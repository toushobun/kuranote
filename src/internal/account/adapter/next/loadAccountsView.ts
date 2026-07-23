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
