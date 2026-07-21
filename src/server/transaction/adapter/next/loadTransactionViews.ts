"use server";

import { notFound } from "next/navigation";

import { getCurrentLedgerOrRedirect } from "lib/ledger/current-ledger";
import { createRequestContainer } from "server/container";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import type {
  TransactionFilters,
  TransactionGroupBy,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
} from "types/transactions";
import { defaultTransactionFilters } from "types/transactions";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getContext() {
  const [currentLedger, dependencies] = await Promise.all([
    getCurrentLedgerOrRedirect(),
    createServerRequestDependencies(),
  ]);
  return {
    currentLedger,
    service: createRequestContainer(dependencies).transaction.service,
  };
}

export async function loadNewTransactionView() {
  const { currentLedger, service } = await getContext();
  return service.getNewView(currentLedger);
}

export async function loadEditTransactionView(transactionRecordId: string) {
  if (!uuidPattern.test(transactionRecordId)) notFound();
  const { currentLedger, service } = await getContext();
  const view = await service.getEditView(currentLedger, transactionRecordId);
  if (!view) notFound();
  return view;
}

export async function loadTransactionFilterOptions() {
  const { currentLedger, service } = await getContext();
  return service.getFilterOptions(currentLedger);
}

export async function loadStep4TransactionGroupView(
  groupBy: TransactionGroupBy = "month",
  filters: TransactionFilters = defaultTransactionFilters,
) {
  const { currentLedger, service } = await getContext();
  return service.getGroupView(currentLedger, groupBy, filters);
}

export async function loadStep4TransactionGroupPage(
  groupBy: TransactionGroupBy,
  offset: number,
  filters: TransactionFilters = defaultTransactionFilters,
): Promise<TransactionGroupPage> {
  const { currentLedger, service } = await getContext();
  return service.getGroupPage(currentLedger, groupBy, offset, filters);
}

export async function loadStep4TransactionGroupItems(
  groupBy: TransactionGroupBy,
  groupKey: string,
  offset: number,
  filters: TransactionFilters = defaultTransactionFilters,
): Promise<TransactionMonthPage> {
  const { currentLedger, service } = await getContext();
  return service.getGroupItems(
    currentLedger,
    groupBy,
    groupKey,
    offset,
    filters,
  );
}

export async function loadTransactionSearchPage(
  rawQuery: string,
  offset = 0,
): Promise<TransactionSearchPage> {
  const { currentLedger, service } = await getContext();
  return service.search(currentLedger, rawQuery, offset);
}
