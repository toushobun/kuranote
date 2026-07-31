import { unstable_rethrow } from "next/navigation";

import { transactionResultValues } from "config/paths";
import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import {
  loadStep4TransactionGroupItems,
  loadStep4TransactionGroupPage,
  loadStep4TransactionGroupView,
  loadTransactionFilterOptions,
} from "internal/transaction/adapter/next/loadTransactionViews";
import {
  TransactionsTemplate,
  type TransactionSaveResult,
} from "templates/transactions/Transactions";
import type {
  TransactionFilterOptions,
  TransactionTimeGroupViewData,
} from "types/transactions";

function getTransactionSaveResult(
  result: string | undefined,
): TransactionSaveResult | null {
  if (result === transactionResultValues.created) return "created";
  if (result === transactionResultValues.deleted) return "deleted";
  if (result === transactionResultValues.updated) return "updated";
  return null;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const params = await searchParams;
  await getCurrentLedgerOrRedirect();

  let timeGroupView: TransactionTimeGroupViewData = emptyTimeGroupView;
  let filterOptions: TransactionFilterOptions = emptyFilterOptions;
  let loadErrorMessage: string | null = null;

  try {
    [timeGroupView, filterOptions] = await Promise.all([
      loadStep4TransactionGroupView("month"),
      loadTransactionFilterOptions(),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    loadErrorMessage = "明细读取失败，请稍后重新读取。";
  }

  return (
    <TransactionsTemplate
      errorMessage={loadErrorMessage}
      filterOptions={filterOptions}
      loadFilteredGroupItemsAction={loadStep4TransactionGroupItems}
      loadFilteredGroupsAction={loadStep4TransactionGroupPage}
      loadGroupViewAction={loadStep4TransactionGroupView}
      saveResult={getTransactionSaveResult(params.result)}
      timeGroupView={timeGroupView}
    />
  );
}

const emptyTimeGroupView: TransactionTimeGroupViewData = {
  groupBy: "month",
  groups: [],
  initialDateGroupsByGroupId: {},
  initialExpandedGroupId: null,
  initialNextItemOffsetByGroupId: {},
  nextOffset: null,
};

const emptyFilterOptions: TransactionFilterOptions = {
  accounts: [],
  categories: [],
  members: [],
  merchants: [],
};
