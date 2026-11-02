"use client";
import { NewTransactionStepFlow } from "../../../../../src/components/templates/transactions/NewTransactionStepFlow";
import { ReceiptCreationProvider } from "../../../../../src/components/organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { flowFixture } from "../../../../../src/test/mocks/transactionStepFlow";
import { receiptItemsOptions } from "../../../../../src/test/mocks/transactionReceipt";
import { accountHolderOptionsFixture } from "../../../../../src/test/mocks/accountHolders";
import {
  createMerchant,
  createAccount,
  fetchMerchantIcon,
  save,
  loadPresets,
  addPresets,
} from "../actions";

export default function NewReceipt({ empty }: { empty: boolean }) {
  return (
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
      <NewTransactionStepFlow
        action={save}
        accountOptions={flowFixture.accounts}
        addPresetsAction={addPresets}
        categoryOptions={receiptItemsOptions.categoryOptions}
        frequentMerchants={empty ? [] : flowFixture.frequentMerchants}
        ledgerId="ledger-1"
        loadPresetsAction={loadPresets}
        merchantOptions={empty ? [] : flowFixture.merchants}
        merchantTags={flowFixture.merchantTags}
        multiAccountPaymentEnabled
        transactionItemSpecialStatusEnabled={false}
      />
    </ReceiptCreationProvider>
  );
}
