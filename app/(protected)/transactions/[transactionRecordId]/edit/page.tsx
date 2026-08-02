import {
  saveEditTransaction,
  voidTransaction,
} from "internal/transaction/adapter/next/actions";
import { loadEditTransactionView } from "internal/transaction/adapter/next/loadTransactionViews";
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
  const { canEdit, ...view } =
    await loadEditTransactionView(transactionRecordId);

  if (canEdit === false) {
    return (
      <NewTransactionVisualFrame>
        <TransactionPermissionDenied operation="edit" />
      </NewTransactionVisualFrame>
    );
  }

  const errorMessage = null;
  const initialValues = view.initialValues;

  if (initialValues.type === "transfer") {
    return (
      <NewTransactionVisualFrame>
        <EditTransferTransactionTemplate
          accountOptions={view.accountOptions}
          action={saveEditTransaction}
          categoryOptions={view.categoryOptions}
          deleteAction={voidTransaction}
          errorMessage={errorMessage}
          initialValues={initialValues}
          ledgerName={view.ledgerName}
          merchantOptions={view.merchantOptions}
          transactionItemSpecialStatusEnabled={
            view.transactionItemSpecialStatusEnabled
          }
        />
      </NewTransactionVisualFrame>
    );
  }

  return (
    <NewTransactionVisualFrame>
      <EditTransactionTemplate
        accountOptions={view.accountOptions}
        action={saveEditTransaction}
        categoryOptions={view.categoryOptions}
        deleteAction={voidTransaction}
        errorMessage={errorMessage}
        initialValues={initialValues}
        ledgerName={view.ledgerName}
        merchantOptions={view.merchantOptions}
        transactionItemSpecialStatusEnabled={
          view.transactionItemSpecialStatusEnabled
        }
      />
    </NewTransactionVisualFrame>
  );
}
