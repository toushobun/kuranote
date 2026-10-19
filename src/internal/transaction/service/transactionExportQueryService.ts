import type {
  TransactionExportPayment,
  TransactionExportRecord,
} from "internal/transaction/entity/transactionExportRecord";
import type { TransactionContextRepository } from "internal/transaction/repository/transactionRepository";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import { readAllPages } from "internal/shared/supabase/readAllPages";
import { requireItemAccountId } from "internal/transaction/util/grouping/recordAccounts";

export interface TransactionExportQueryService {
  listAllForExport(input: {
    ledgerId: string;
    userId: string;
  }): Promise<TransactionExportRecord[]>;
}

export function createTransactionExportQueryService({
  transactionRepository,
  ledgerAccessService,
}: {
  transactionRepository: TransactionContextRepository;
  ledgerAccessService: LedgerAccessService;
}): TransactionExportQueryService {
  return {
    async listAllForExport({ ledgerId, userId }) {
      await requireActiveLedgerMemberRole(ledgerAccessService, {
        ledgerId,
        userId,
      });
      const result: TransactionExportRecord[] = [];
      // 分批加载关联明细，公共契约始终返回整个账本，不暴露分页参数。
      for (let offset = 0; ; ) {
        const records = await transactionRepository.listRecords({
          ledgerId,
          recordType: "all",
          offset,
          limit: 100,
        });
        if (records.length === 0) return result;
        const normalRecordIds = records
          .filter((record) => record.type === "normal")
          .map((record) => record.id);
        const [items, payments, users] = await Promise.all([
          readAllPages((offset, limit) =>
            transactionRepository.listItems(
              ledgerId,
              records.map((record) => record.id),
              { offset, limit },
            ),
          ),
          normalRecordIds.length > 0
            ? readAllPages((offset, limit) =>
                transactionRepository.listPayments(ledgerId, normalRecordIds, {
                  offset,
                  limit,
                }),
              )
            : Promise.resolve([]),
          transactionRepository.findUserSummaries(
            ledgerId,
            records.flatMap((record) =>
              record.created_by ? [record.created_by] : [],
            ),
          ),
        ]);
        const recorderById = new Map(
          users.map((user) => [user.id, user.display_name]),
        );
        const itemsByRecord = new Map<string, typeof items>();
        for (const item of items) {
          const recordItems =
            itemsByRecord.get(item.transaction_record_id) ?? [];
          recordItems.push(item);
          itemsByRecord.set(item.transaction_record_id, recordItems);
        }
        const paymentsByRecord = new Map<string, TransactionExportPayment[]>();
        for (const payment of payments) {
          const recordPayments =
            paymentsByRecord.get(payment.transaction_record_id) ?? [];
          recordPayments.push({
            accountId: payment.account_id,
            amount: payment.amount,
          });
          paymentsByRecord.set(payment.transaction_record_id, recordPayments);
        }
        result.push(
          ...records.map((record): TransactionExportRecord => {
            const common = {
              id: record.id,
              transactionAt: record.transaction_at,
              merchantId: record.merchant_id,
              recorderName: record.created_by
                ? (recorderById.get(record.created_by) ?? "")
                : "",
              note: record.note ?? "",
            };
            const recordItems = itemsByRecord.get(record.id) ?? [];
            if (record.type === "normal") {
              return {
                ...common,
                type: "normal",
                items: recordItems.map((item) => ({
                  categoryId: item.category_id,
                  amount: item.amount,
                })),
                payments: paymentsByRecord.get(record.id) ?? [],
              };
            }
            // 转账 / 余额调整的账户仍在明细上；普通记录的账户只来自付款明细。
            return {
              ...common,
              type: record.type,
              items: recordItems.map((item) => ({
                accountId: requireItemAccountId(item),
                categoryId: item.category_id,
                amount: item.amount,
                balanceDelta: item.balance_delta ?? item.amount,
              })),
            };
          }),
        );
        offset += records.length;
      }
    },
  };
}
