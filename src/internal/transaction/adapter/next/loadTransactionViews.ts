"use server";

import { notFound } from "next/navigation";

import { getCurrentLedgerOrRedirect } from "internal/ledger/adapter/next/currentLedger";
import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import type {
  FrequentMerchant,
  TransactionLinkCandidatePageInput,
  TransactionFilters,
  TransactionGroupBy,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
} from "internal/transaction";
import { defaultTransactionFilters } from "internal/transaction";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const [view, frequentMerchants] = await Promise.all([
    service.getNewView(currentLedger),
    loadFrequentMerchants(context),
  ]);
  return { ...view, frequentMerchants };
}

export async function loadEditTransactionView(transactionRecordId: string) {
  if (!uuidPattern.test(transactionRecordId)) notFound();
  const context = await getContext();
  const { currentLedger, service } = context;
  const [view, frequentMerchants] = await Promise.all([
    service.getEditEntryView(currentLedger, transactionRecordId),
    // 小票换商家时的常用商家（#962）。
    loadFrequentMerchants(context),
  ]);
  if (!view) notFound();
  return { ...view, frequentMerchants };
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

/** 打开和加载更多共用扁平候选分页，不读取月份分组。 */
export async function loadRefundPickerPage(
  input: TransactionLinkCandidatePageInput = {},
) {
  const { currentLedger, service } = await getContext();
  return service.getLinkCandidatePage(currentLedger, "refund", {
    ...input,
    merchantId:
      input.merchantId && uuidPattern.test(input.merchantId)
        ? input.merchantId
        : undefined,
  });
}

export async function loadReimbursementPickerPage(
  input: TransactionLinkCandidatePageInput = {},
) {
  const { currentLedger, service } = await getContext();
  return service.getLinkCandidatePage(currentLedger, "reimbursement", {
    ...input,
    merchantId: undefined,
  });
}
