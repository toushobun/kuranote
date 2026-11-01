"use client";

import { AccountEditTemplate } from "../../../../../src/components/templates/accounts/AccountEdit";
import { bankAccountFixture } from "../../../../../src/test/mocks/accounts";
import { accountHolderOptionsFixture } from "../../../../../src/test/mocks/accountHolders";
import type { save as saveAction } from "../actions";

export default function Editor({ save }: { save: typeof saveAction }) {
  return (
    <AccountEditTemplate
      account={bankAccountFixture}
      archiveAccountAction={save}
      baseCurrency="JPY"
      canWriteTransactions={false}
      holderOptions={accountHolderOptionsFixture}
      ledgerName="兼容性测试账本"
      updateAccountAction={save}
    />
  );
}
