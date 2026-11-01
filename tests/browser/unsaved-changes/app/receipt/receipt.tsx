"use client";

import type { TransactionFormInitialValues } from "../../../../../src/components/organisms/transactions/TransactionForm/TransactionForm.types";
import type { save as saveAction } from "../actions";

import { EditTransactionReceiptTemplate } from "../../../../../src/components/templates/transactions/EditTransactionReceipt";
import { flowFixture } from "../../../../../src/test/mocks/transactionStepFlow";
import { receiptItemsOptions } from "../../../../../src/test/mocks/transactionReceipt";

const initialValues: TransactionFormInitialValues = {
  items: [{ amount: "800", categoryId: "lunch", specialStatus: null }],
  merchantId: "seven",
  note: "编辑前备注",
  payments: [{ accountId: "paypay", amount: null }],
  transactionAt: "2026-10-29T03:20:10.000Z",
  transactionRecordId: "00000000-0000-4000-8000-000000009001",
  type: "expense",
};

export default function Receipt({ save }: { save: typeof saveAction }) {
  return (
    <>
      <EditTransactionReceiptTemplate
        accountOptions={flowFixture.accounts}
        action={save}
        canDelete
        categoryOptions={receiptItemsOptions.categoryOptions}
        deleteAction={save}
        editRestriction={null}
        frequentMerchants={flowFixture.frequentMerchants}
        initialValues={initialValues}
        ledgerId="ledger-1"
        merchantOptions={flowFixture.merchants}
        merchantTags={flowFixture.merchantTags}
        multiAccountPaymentEnabled
        transactionItemSpecialStatusEnabled={false}
      />
    </>
  );
}
