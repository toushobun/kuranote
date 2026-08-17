import { redirect } from "next/navigation";

import { transactionEditHref } from "config/paths";
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
import { TransactionIncomeLinksProvider } from "organisms/transactions/TransactionForm/TransactionIncomeLinksContext";
import {
  NewTransactionTemplate,
  TransactionPermissionDenied,
} from "templates/transactions/TransactionFormPage";
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

  const {
    canWriteTransactions,
    refundPickerView,
    reimbursementPickerView,
    ...view
  } = await loadNewTransactionView();

  if (canWriteTransactions === false) {
    return (
      <NewTransactionVisualFrame>
        <TransactionPermissionDenied operation="create" />
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

  return (
    <NewTransactionVisualFrame>
      <TransactionIncomeLinksProvider value={incomeLinksValue}>
        <NewTransactionTemplate
          action={createTransaction}
          errorMessage={null}
          initialType={parseInitialType(params.type)}
          {...view}
        />
      </TransactionIncomeLinksProvider>
    </NewTransactionVisualFrame>
  );
}
