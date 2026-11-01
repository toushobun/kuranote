import { canManageMasterData } from "internal/ledger";
import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { loadAccountCreateView } from "internal/account/adapter/next/loadAccountsView";
import { createAccount } from "internal/account/adapter/next/actions";
import { loadMerchantCreateView } from "internal/merchant/adapter/next/loadMerchantEditorViews";
import {
  createMerchant,
  fetchMerchantIcon,
} from "internal/merchant/adapter/next/actions";

/** 小票只为管理成员加载新增表单；复用独立新增页的权限与读取入口。 */
export async function loadReceiptCreationView() {
  const ledger = await getCurrentLedgerOrRedirect();
  if (!canManageMasterData(ledger.currentUserRole)) return null;
  const [merchant, account] = await Promise.all([
    loadMerchantCreateView(),
    loadAccountCreateView(),
  ]);
  return {
    merchant: {
      ...merchant,
      createMerchantAction: createMerchant,
      fetchIconAction: fetchMerchantIcon,
    },
    account: { ...account, createAccountAction: createAccount },
  };
}
