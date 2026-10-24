import {
  saveEditTransaction,
  updateBalanceAdjustmentTransaction,
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
import { BalanceAdjustmentEditForm } from "organisms/transactions/BalanceAdjustmentEditForm/BalanceAdjustmentEditForm";
import { TransactionIncomeLinksProvider } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import {
  EditTransactionTemplate,
  EditTransferTransactionTemplate,
} from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";

export default async function TransactionEditPage({
  params,
}: {
  params: Promise<{ transactionRecordId: string }>;
}) {
  const { transactionRecordId } = await params;
  // 有限制（无权限 / 账户已归档等）时各模板显示只读详情，保存与删除仍由服务端校验（#928）。
  const {
    canDelete,
    editRestriction,
    refundPickerView,
    reimbursementPickerView,
    ...view
  } = await loadEditTransactionView(transactionRecordId);

  const errorMessage = null;
  const initialValues = view.initialValues;
  if (initialValues.type === "balance_adjustment") {
    return (
      <NewTransactionVisualFrame>
        <BalanceAdjustmentEditForm
          initialValues={initialValues}
          action={updateBalanceAdjustmentTransaction}
          canDelete={canDelete}
          deleteAction={voidTransaction}
          editRestriction={editRestriction}
        />
      </NewTransactionVisualFrame>
    );
  }
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
            canDelete={canDelete}
            categoryOptions={view.categoryOptions}
            deleteAction={voidTransaction}
            editRestriction={editRestriction}
            errorMessage={errorMessage}
            frequentCategoryIds={view.frequentCategoryIds}
            initialValues={initialValues}
            ledgerName={view.ledgerName}
            merchantOptions={view.merchantOptions}
            multiAccountPaymentEnabled={view.multiAccountPaymentEnabled}
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
          canDelete={canDelete}
          categoryOptions={view.categoryOptions}
          deleteAction={voidTransaction}
          editRestriction={editRestriction}
          errorMessage={errorMessage}
          frequentCategoryIds={view.frequentCategoryIds}
          initialValues={initialValues}
          ledgerName={view.ledgerName}
          merchantOptions={view.merchantOptions}
          multiAccountPaymentEnabled={view.multiAccountPaymentEnabled}
          transactionItemSpecialStatusEnabled={
            view.transactionItemSpecialStatusEnabled
          }
        />
      </TransactionIncomeLinksProvider>
    </NewTransactionVisualFrame>
  );
}
