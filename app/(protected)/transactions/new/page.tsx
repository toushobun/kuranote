import { redirect } from "next/navigation";

import { transactionEditHref } from "config/paths";
import {
  addMerchantPresets,
  loadMerchantPresets,
} from "internal/merchant/adapter/next/actions";
import { createTransaction } from "internal/transaction/adapter/next/actions";
import {
  loadNewTransactionView,
  loadRefundPickerGroupItems,
  loadRefundPickerGroupPage,
  loadRefundPickerSearchPage,
  loadReimbursementPickerGroupItems,
  loadReimbursementPickerGroupPage,
  loadReimbursementPickerSearchPage,
} from "internal/transaction/adapter/next/loadTransactionViews";
import {
  resolveNewTransactionEntry,
  type NewTransactionEntrySearchParams,
} from "internal/transaction/adapter/next/newTransactionEntry";
import { TransactionIncomeLinksProvider } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import { NewTransactionStepFlow } from "templates/transactions/NewTransactionStepFlow";
import {
  NewTransactionTemplate,
  NewTransferTransactionTemplate,
  TransactionPermissionDenied,
} from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";

export default async function TransactionsNewPage({
  searchParams,
}: {
  searchParams: Promise<NewTransactionEntrySearchParams & { editId?: string }>;
}) {
  const params = await searchParams;

  if (params.editId) {
    redirect(transactionEditHref(params.editId));
  }

  const {
    canWriteTransactions,
    frequentMerchants,
    ledgerId,
    merchantTags,
    refundPickerView,
    reimbursementPickerView,
    ...view
  } = await loadNewTransactionView();

  if (canWriteTransactions === false) {
    return (
      <NewTransactionVisualFrame>
        <TransactionPermissionDenied />
      </NewTransactionVisualFrame>
    );
  }

  const entry = resolveNewTransactionEntry(params, view);
  const incomeLinksValue = {
    loadRefundGroupItemsAction: loadRefundPickerGroupItems,
    loadRefundMoreGroupsAction: loadRefundPickerGroupPage,
    loadRefundSearchPageAction: loadRefundPickerSearchPage,
    loadReimbursementGroupItemsAction: loadReimbursementPickerGroupItems,
    loadReimbursementMoreGroupsAction: loadReimbursementPickerGroupPage,
    loadReimbursementSearchPageAction: loadReimbursementPickerSearchPage,
    refundPickerView,
    reimbursementPickerView,
  };

  return (
    <NewTransactionVisualFrame>
      <TransactionIncomeLinksProvider value={incomeLinksValue}>
        {entry.method === "merchant" ? (
          <NewTransactionStepFlow
            action={createTransaction}
            accountOptions={view.accountOptions}
            addPresetsAction={addMerchantPresets}
            categoryOptions={view.categoryOptions}
            frequentMerchants={frequentMerchants}
            initialAccountId={entry.initialAccountId}
            initialMerchantId={entry.initialMerchantId}
            ledgerId={ledgerId}
            loadPresetsAction={loadMerchantPresets}
            merchantOptions={view.merchantOptions}
            merchantTags={merchantTags}
            multiAccountPaymentEnabled={view.multiAccountPaymentEnabled}
            transactionItemSpecialStatusEnabled={
              view.transactionItemSpecialStatusEnabled
            }
          />
        ) : entry.method === "transfer" ? (
          <NewTransferTransactionTemplate
            accountOptions={view.accountOptions}
            action={createTransaction}
          />
        ) : (
          <NewTransactionTemplate
            action={createTransaction}
            errorMessage={null}
            initialType={entry.standardType}
            {...view}
          />
        )}
      </TransactionIncomeLinksProvider>
    </NewTransactionVisualFrame>
  );
}
