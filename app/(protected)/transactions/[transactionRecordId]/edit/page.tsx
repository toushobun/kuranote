import { loadReceiptCreationView } from "../../loadReceiptCreationView";
import { ReceiptCreationProvider } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import {
  saveEditTransaction,
  updateBalanceAdjustmentTransaction,
  voidTransaction,
} from "internal/transaction/adapter/next/actions";
import {
  loadEditTransactionView,
  loadRefundPickerPage,
  loadReimbursementPickerPage,
} from "internal/transaction/adapter/next/loadTransactionViews";
import { BalanceAdjustmentEditForm } from "organisms/transactions/BalanceAdjustmentEditForm/BalanceAdjustmentEditForm";
import { TransactionIncomeLinksProvider } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import { EditTransactionReceiptTemplate } from "templates/transactions/EditTransactionReceipt";
import { EditTransferTransactionTemplate } from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";

export default async function TransactionEditPage({
  params,
}: {
  params: Promise<{ transactionRecordId: string }>;
}) {
  const { transactionRecordId } = await params;
  // 有限制（无权限 / 账户已归档等）时各模板显示只读详情，保存与删除仍由服务端校验（#928）。
  const [loadedView, loadedReceiptCreation] = await Promise.all([
    loadEditTransactionView(transactionRecordId),
    loadReceiptCreationView(),
  ]);
  const { canDelete, editRestriction, ...view } = loadedView;

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
    loadRefundPageAction: loadRefundPickerPage,
    loadReimbursementPageAction: loadReimbursementPickerPage,
  };

  const receiptCreation = !editRestriction ? loadedReceiptCreation : null;
  if (initialValues.type === "transfer") {
    return (
      <NewTransactionVisualFrame>
        <ReceiptCreationProvider data={receiptCreation}>
          <EditTransferTransactionTemplate
            accountOptions={view.accountOptions}
            action={saveEditTransaction}
            archivedAccountOptions={view.archivedAccountOptions}
            canDelete={canDelete}
            deleteAction={voidTransaction}
            editRestriction={editRestriction}
            initialValues={initialValues}
          />
        </ReceiptCreationProvider>
      </NewTransactionVisualFrame>
    );
  }

  return (
    <NewTransactionVisualFrame>
      <TransactionIncomeLinksProvider value={incomeLinksValue}>
        <ReceiptCreationProvider data={receiptCreation}>
          <EditTransactionReceiptTemplate
            accountOptions={view.accountOptions}
            action={saveEditTransaction}
            archivedAccountOptions={view.archivedAccountOptions}
            canDelete={canDelete}
            categoryOptions={view.categoryOptions}
            deleteAction={voidTransaction}
            editRestriction={editRestriction}
            frequentMerchants={view.frequentMerchants}
            initialValues={initialValues}
            ledgerId={view.ledgerId}
            merchantOptions={view.merchantOptions}
            merchantTags={view.merchantTags}
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
