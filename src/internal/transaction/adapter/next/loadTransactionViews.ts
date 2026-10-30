"use server";

import { notFound } from "next/navigation";

import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import type {
  FrequentMerchant,
  TransactionFilters,
  TransactionGroupBy,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
} from "internal/transaction";
import { defaultTransactionFilters } from "internal/transaction";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const refundPickerFilters: TransactionFilters = {
  recordType: "refundableExpense",
};
const reimbursementPickerFilters: TransactionFilters = {
  recordType: "refundableExpense",
  specialStatuses: [
    "pendingReimbursement",
    "reimbursed",
    "reimbursementSurplus",
  ],
};

async function getContext() {
  const [currentLedger, dependencies] = await Promise.all([
    getCurrentLedgerOrRedirect(),
    createServerRequestDependencies(),
  ]);
  const transaction = createRequestContainer(dependencies).transaction;
  return {
    currentLedger,
    logger: dependencies.logger,
    merchantEntryQueryService: transaction.merchantEntryQueryService,
    service: transaction.service,
  };
}

// 常用商家与全部商家一起出现；获取失败时按空列表处理，不阻断记账。
function loadFrequentMerchants({
  currentLedger,
  logger,
  merchantEntryQueryService,
}: Awaited<ReturnType<typeof getContext>>) {
  return merchantEntryQueryService
    .getFrequentMerchants({ ledgerId: currentLedger.id })
    .catch((error: unknown): FrequentMerchant[] => {
      logger.error("[transaction] failed to load frequent merchants", {
        errorName: error instanceof Error ? error.name : "unknown",
      });
      return [];
    });
}

export async function loadNewTransactionView() {
  const context = await getContext();
  const { currentLedger, service } = context;
  const specialStatusEnabled = Boolean(
    currentLedger.transactionItemSpecialStatusEnabled,
  );
  const [view, refundPickerView, reimbursementPickerView, frequentMerchants] =
    await Promise.all([
      service.getNewView(currentLedger),
      specialStatusEnabled
        ? service.getGroupView(currentLedger, "month", refundPickerFilters)
        : Promise.resolve(undefined),
      specialStatusEnabled
        ? service.getGroupView(
            currentLedger,
            "month",
            reimbursementPickerFilters,
          )
        : Promise.resolve(undefined),
      loadFrequentMerchants(context),
    ]);
  return {
    ...view,
    frequentMerchants,
    refundPickerView,
    reimbursementPickerView,
  };
}

export async function loadEditTransactionView(transactionRecordId: string) {
  if (!uuidPattern.test(transactionRecordId)) notFound();
  const context = await getContext();
  const { currentLedger, service } = context;
  const specialStatusEnabled = Boolean(
    currentLedger.transactionItemSpecialStatusEnabled,
  );
  const [view, refundPickerView, reimbursementPickerView, frequentMerchants] =
    await Promise.all([
      service.getEditEntryView(currentLedger, transactionRecordId),
      specialStatusEnabled
        ? service.getGroupView(currentLedger, "month", refundPickerFilters)
        : Promise.resolve(undefined),
      specialStatusEnabled
        ? service.getGroupView(
            currentLedger,
            "month",
            reimbursementPickerFilters,
          )
        : Promise.resolve(undefined),
      // 小票换商家时的常用商家（#962）。
      loadFrequentMerchants(context),
    ]);
  if (!view) notFound();
  return {
    ...view,
    frequentMerchants,
    refundPickerView,
    reimbursementPickerView,
  };
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

export async function loadRefundPickerGroupPage(
  offset: number,
): Promise<TransactionGroupPage> {
  const { currentLedger, service } = await getContext();
  return service.getGroupPage(
    currentLedger,
    "month",
    offset,
    refundPickerFilters,
  );
}

export async function loadRefundPickerGroupItems(
  groupKey: string,
  offset: number,
): Promise<TransactionMonthPage> {
  const { currentLedger, service } = await getContext();
  return service.getGroupItems(
    currentLedger,
    "month",
    groupKey,
    offset,
    refundPickerFilters,
  );
}

export async function loadRefundPickerSearchPage(
  rawQuery: string,
  offset = 0,
): Promise<TransactionSearchPage> {
  const { currentLedger, service } = await getContext();
  return service.search(currentLedger, rawQuery, offset, refundPickerFilters);
}

export async function loadReimbursementPickerGroupPage(
  offset: number,
): Promise<TransactionGroupPage> {
  const { currentLedger, service } = await getContext();
  return service.getGroupPage(
    currentLedger,
    "month",
    offset,
    reimbursementPickerFilters,
  );
}

export async function loadReimbursementPickerGroupItems(
  groupKey: string,
  offset: number,
): Promise<TransactionMonthPage> {
  const { currentLedger, service } = await getContext();
  return service.getGroupItems(
    currentLedger,
    "month",
    groupKey,
    offset,
    reimbursementPickerFilters,
  );
}

export async function loadReimbursementPickerSearchPage(
  rawQuery: string,
  offset = 0,
): Promise<TransactionSearchPage> {
  const { currentLedger, service } = await getContext();
  return service.search(
    currentLedger,
    rawQuery,
    offset,
    reimbursementPickerFilters,
  );
}
