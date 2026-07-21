import { redirect } from "next/navigation";

import { routePaths } from "config/paths";
import {
  saveEditTransaction,
  voidTransaction,
} from "server/transaction/adapter/next/actions";
import { loadEditTransactionView } from "server/transaction/adapter/next/loadTransactionViews";
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
  const { canEdit, ...view } =
    await loadEditTransactionView(transactionRecordId);

  if (canEdit === false) {
    redirect(routePaths.transactions);
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
          tagOptions={view.tagOptions}
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
        tagOptions={view.tagOptions}
      />
    </NewTransactionVisualFrame>
  );
}
