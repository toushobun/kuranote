import type { TransactionExportRecord } from "internal/transaction/entity/transactionExportRecord";
import type { TransactionContextRepository } from "internal/transaction/repository/transactionRepository";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import { readAllPages } from "internal/shared/supabase/readAllPages";

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
        const [items, users] = await Promise.all([
          readAllPages((offset, limit) =>
            transactionRepository.listItems(
              ledgerId,
              records.map((record) => record.id),
              { offset, limit },
            ),
          ),
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
        const itemsByRecord = new Map<
          string,
          TransactionExportRecord["items"]
        >();
        for (const item of items) {
          const recordItems =
            itemsByRecord.get(item.transaction_record_id) ?? [];
          recordItems.push({
            accountId: item.account_id,
            categoryId: item.category_id,
            amount: item.amount,
            balanceDelta: item.balance_delta ?? item.amount,
          });
          itemsByRecord.set(item.transaction_record_id, recordItems);
        }
        result.push(
          ...records.map((record) => ({
            id: record.id,
            type: record.type,
            transactionAt: record.transaction_at,
            merchantId: record.merchant_id,
            recorderName: record.created_by
              ? (recorderById.get(record.created_by) ?? "")
              : "",
            note: record.note ?? "",
            items: itemsByRecord.get(record.id) ?? [],
          })),
        );
        offset += records.length;
      }
    },
  };
}
