import {
  saveEditTransaction,
  voidTransaction,
} from "internal/transaction/adapter/next/actions";
import {
  loadEditTransactionView,
  loadRefundPickerGroupItems,
  loadRefundPickerGroupPage,
  loadRefundPickerSearchPage,
  loadReimbursementPickerGroupItems,
  loadReimbursementPickerGroupPage,
  loadReimbursementPickerSearchPage,
} from "internal/transaction/adapter/next/loadTransactionViews";
import { TransactionIncomeLinksProvider } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import {
  EditTransactionTemplate,
  EditTransferTransactionTemplate,
  TransactionPermissionDenied,
} from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";

export default async function TransactionEditPage({
  params,
}: {
  params: Promise<{ transactionRecordId: string }>;
}) {
  const { transactionRecordId } = await params;
  const {
    canEdit,
    editRestriction,
    refundPickerView,
    reimbursementPickerView,
    ...view
  } = await loadEditTransactionView(transactionRecordId);

  if (canEdit === false) {
    return (
      <NewTransactionVisualFrame>
        <TransactionPermissionDenied
          operation="edit"
          reason={editRestriction ?? "permission"}
        />
      </NewTransactionVisualFrame>
    );
  }

  const errorMessage = null;
  const initialValues = view.initialValues;
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

  if (initialValues.type === "transfer") {
    return (
      <NewTransactionVisualFrame>
        <TransactionIncomeLinksProvider value={incomeLinksValue}>
          <EditTransferTransactionTemplate
            accountOptions={view.accountOptions}
            action={saveEditTransaction}
            categoryOptions={view.categoryOptions}
            deleteAction={voidTransaction}
            errorMessage={errorMessage}
            frequentCategoryIds={view.frequentCategoryIds}
            initialValues={initialValues}
            ledgerName={view.ledgerName}
            merchantOptions={view.merchantOptions}
            transactionItemSpecialStatusEnabled={
              view.transactionItemSpecialStatusEnabled
            }
          />
        </TransactionIncomeLinksProvider>
      </NewTransactionVisualFrame>
    );
  }

  return (
    <NewTransactionVisualFrame>
      <TransactionIncomeLinksProvider value={incomeLinksValue}>
        <EditTransactionTemplate
          accountOptions={view.accountOptions}
          action={saveEditTransaction}
          categoryOptions={view.categoryOptions}
          deleteAction={voidTransaction}
          errorMessage={errorMessage}
          frequentCategoryIds={view.frequentCategoryIds}
          initialValues={initialValues}
          ledgerName={view.ledgerName}
          merchantOptions={view.merchantOptions}
          transactionItemSpecialStatusEnabled={
            view.transactionItemSpecialStatusEnabled
          }
        />
      </TransactionIncomeLinksProvider>
    </NewTransactionVisualFrame>
  );
}
