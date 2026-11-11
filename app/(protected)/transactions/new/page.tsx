import { loadReceiptCreationView } from "../loadReceiptCreationView";
import { ReceiptCreationProvider } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { redirect } from "next/navigation";

import { transactionEditHref } from "config/paths";
import {
  addMerchantPresets,
  loadMerchantPresets,
} from "internal/merchant/adapter/next/actions";
import { createTransaction } from "internal/transaction/adapter/next/actions";
import {
  loadNewTransactionView,
  loadRefundPickerInitialView,
  loadRefundPickerGroupItems,
  loadRefundPickerGroupPage,
  loadRefundPickerSearchPage,
  loadReimbursementPickerInitialView,
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
import { TransactionPermissionDenied } from "templates/transactions/TransactionFormPage";
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

  const [loadedView, receiptCreation] = await Promise.all([
    loadNewTransactionView(),
    loadReceiptCreationView(),
  ]);
  const {
    canWriteTransactions,
    frequentMerchants,
    ledgerId,
    merchantTags,
    ...view
  } = loadedView;

  if (canWriteTransactions === false) {
    return (
      <NewTransactionVisualFrame>
        <TransactionPermissionDenied />
      </NewTransactionVisualFrame>
    );
  }

  const incomeLinksValue = {
    loadRefundInitialViewAction: loadRefundPickerInitialView,
    loadReimbursementInitialViewAction: loadReimbursementPickerInitialView,
    loadRefundGroupItemsAction: loadRefundPickerGroupItems,
    loadRefundMoreGroupsAction: loadRefundPickerGroupPage,
    loadRefundSearchPageAction: loadRefundPickerSearchPage,
    loadReimbursementGroupItemsAction: loadReimbursementPickerGroupItems,
    loadReimbursementMoreGroupsAction: loadReimbursementPickerGroupPage,
    loadReimbursementSearchPageAction: loadReimbursementPickerSearchPage,
  };

  return (
    <NewTransactionVisualFrame>
      <TransactionIncomeLinksProvider value={incomeLinksValue}>
        <ReceiptCreationProvider data={receiptCreation}>
          <NewTransactionStepFlow
            action={createTransaction}
            accountOptions={view.accountOptions}
            addPresetsAction={addMerchantPresets}
            categoryOptions={view.categoryOptions}
            frequentMerchants={frequentMerchants}
            initialMethod={resolveNewTransactionEntry(params)}
            ledgerId={ledgerId}
            loadPresetsAction={loadMerchantPresets}
            merchantOptions={view.merchantOptions}
            merchantTags={merchantTags}
            multiAccountPaymentEnabled={view.multiAccountPaymentEnabled}
            transactionItemSpecialStatusEnabled={
              view.transactionItemSpecialStatusEnabled
            }
          />
        </ReceiptCreationProvider>
      </TransactionIncomeLinksProvider>
    </NewTransactionVisualFrame>
  );
}
