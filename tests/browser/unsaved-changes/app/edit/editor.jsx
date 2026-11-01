"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AccountEditTemplate } from "../../../../../src/components/templates/accounts/AccountEdit";
import { bankAccountFixture } from "../../../../../src/test/mocks/accounts";
import { accountHolderOptionsFixture } from "../../../../../src/test/mocks/accountHolders";

export default function Editor({ save }) {
  useEffect(() => {
    window.probeMounts = (window.probeMounts ?? 0) + 1;
    return () => {
      window.probeUnmounts = (window.probeUnmounts ?? 0) + 1;
    };
  }, []);
  return (
    <>
      <AccountEditTemplate
        account={bankAccountFixture}
        archiveAccountAction={save}
        baseCurrency="JPY"
        canWriteTransactions={false}
        holderOptions={accountHolderOptionsFixture}
        ledgerName="兼容性测试账本"
        updateAccountAction={save}
      />
      <Link href="/" prefetch={false}>
        验证用底部导航
      </Link>
    </>
  );
}
