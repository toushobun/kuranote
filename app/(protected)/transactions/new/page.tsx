import { redirect } from "next/navigation";

import { routePaths, transactionEditHref } from "config/paths";
import { createTransaction } from "server/transaction/adapter/next/actions";
import { loadNewTransactionView } from "server/transaction/adapter/next/loadTransactionViews";
import { NewTransactionTemplate } from "templates/transactions/TransactionFormPage";
import { NewTransactionVisualFrame } from "templates/transactions/NewTransactionVisualFrame";
import type { TransactionRecordType } from "types/transactions";

function parseInitialType(type?: string): TransactionRecordType {
  if (type === "expense" || type === "income" || type === "transfer") {
    return type;
  }

  return "expense";
}

export default async function TransactionsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ editId?: string; type?: string }>;
}) {
  const params = await searchParams;

  if (params.editId) {
    redirect(transactionEditHref(params.editId));
  }

  const { canWriteTransactions, ...view } = await loadNewTransactionView();

  if (canWriteTransactions === false) {
    redirect(routePaths.transactions);
  }

  return (
    <NewTransactionVisualFrame>
      <NewTransactionTemplate
        action={createTransaction}
        errorMessage={null}
        initialType={parseInitialType(params.type)}
        {...view}
      />
    </NewTransactionVisualFrame>
  );
}
