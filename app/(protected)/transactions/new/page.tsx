import { redirect } from "next/navigation";

import {
  editTransactionErrorHref,
  transactionEditHref,
  transactionsErrorHref,
} from "config/paths";
import { createTransaction } from "server/actions/transactions";
import { transactionErrorCodes } from "server/errors/transactions";
import { loadNewTransactionView } from "server/loaders/transactionForm";
import { NewTransactionTemplate } from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";
import type { TransactionRecordType } from "types/transactions";
import { getNewTransactionErrorMessage } from "utils/pageErrors";

function parseInitialType(type?: string): TransactionRecordType {
  if (type === "expense" || type === "income" || type === "transfer") {
    return type;
  }

  return "expense";
}

export default async function TransactionsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; editId?: string; type?: string }>;
}) {
  const params = await searchParams;

  if (params.editId) {
    redirect(
      params.error
        ? editTransactionErrorHref(params.editId, params.error)
        : transactionEditHref(params.editId),
    );
  }

  const { canWriteTransactions, ...view } = await loadNewTransactionView();

  if (canWriteTransactions === false) {
    redirect(transactionsErrorHref(transactionErrorCodes.permissionDenied));
  }

  return (
    <NewTransactionVisualFrame>
      <NewTransactionTemplate
        action={createTransaction}
        errorMessage={getNewTransactionErrorMessage(params.error)}
        initialType={parseInitialType(params.type)}
        {...view}
      />
    </NewTransactionVisualFrame>
  );
}
