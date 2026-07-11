import { redirect } from "next/navigation";

import { transactionsErrorHref } from "config/paths";
import {
  saveEditTransaction,
  voidTransaction,
} from "server/actions/transactions";
import { transactionErrorCodes } from "server/errors/transactions";
import { loadEditTransactionView } from "server/loaders/transactionForm";
import {
  EditTransactionTemplate,
  EditTransferTransactionTemplate,
} from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";
import { getEditTransactionErrorMessage } from "utils/pageErrors";

export default async function TransactionEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionRecordId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ transactionRecordId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const { canEdit, ...view } =
    await loadEditTransactionView(transactionRecordId);

  if (canEdit === false) {
    redirect(transactionsErrorHref(transactionErrorCodes.permissionDenied));
  }

  const errorMessage = getEditTransactionErrorMessage(query.error);
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
