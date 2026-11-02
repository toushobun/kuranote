"use client";
import { useState } from "react";
import { TransactionStepFlow } from "../../../../../src/components/organisms/transactions/TransactionStepFlow/TransactionStepFlow";
import { ReceiptCreationProvider } from "../../../../../src/components/organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { flowFixture } from "../../../../../src/test/mocks/transactionStepFlow";
import { receiptItemsOptions } from "../../../../../src/test/mocks/transactionReceipt";
import { accountHolderOptionsFixture } from "../../../../../src/test/mocks/accountHolders";
import {
  createMerchant,
  createAccount,
  fetchMerchantIcon,
  save,
} from "../actions";

export default function NewReceipt() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <h1>新增流程后退验证</h1>
      <button onClick={() => setOpen(true)}>重新打开新增流程</button>
      <ReceiptCreationProvider
        data={{
          merchant: {
            createMerchantAction: createMerchant,
            fetchIconAction: fetchMerchantIcon,
            ledgerId: "ledger-1",
            ledgerName: "验证账本",
            tags: [],
          },
          account: {
            createAccountAction: createAccount,
            baseCurrency: "JPY",
            holderOptions: accountHolderOptionsFixture,
            ledgerName: "验证账本",
          },
        }}
      >
        <TransactionStepFlow
          {...flowFixture}
          action={save}
          open={open}
          onClose={() => setOpen(false)}
          suggestionsMerchantId="seven"
          suggestions={{
            recommendedAccountIds: [],
            automaticCategoryIds: [],
            quickAmounts: [],
          }}
          itemsOptions={{
            ...receiptItemsOptions,
            initialItems: [{ categoryId: "lunch", amount: "800" }],
            initialPayments: [{ accountId: "paypay", amount: null }],
          }}
        />
      </ReceiptCreationProvider>
    </>
  );
}
