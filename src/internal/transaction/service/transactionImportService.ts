import { serverFallbackTimeZone } from "config/dateTime";
import type { CurrentLedger } from "internal/ledger";
import { ValidationError } from "internal/shared/errors/appError";
import {
  getTransactionValidationErrorMessage,
  transactionErrorCodes,
} from "internal/transaction/errors";
import type { TransactionService } from "internal/transaction/service/transactionService";
import { toTransactionTimestamp } from "internal/transaction/util/transactionTimestamp";
import { getDateKeyInTimeZone } from "utils/transactions";

export type ImportTransactionItemInput = {
  amount: number;
  categoryId: string;
};

export type ImportNormalTransactionInput = {
  accountId: string;
  items: ImportTransactionItemInput[];
  ledgerId: string;
  merchantId: string;
  note: string | null;
  timeZoneOffsetMinutes: number;
  transactionAt: string;
  type: "expense" | "income";
};

export type ImportTransferTransactionInput = {
  accountId: string;
  ledgerId: string;
  note: string | null;
  timeZoneOffsetMinutes: number;
  transactionAt: string;
  transferAmount: number;
  transferTargetAccountId: string;
};

export interface TransactionImportService {
  createNormal(input: ImportNormalTransactionInput): Promise<void>;
  createTransfer(input: ImportTransferTransactionInput): Promise<void>;
  hasPossibleNormalDuplicate(
    input: ImportNormalTransactionInput & { totalAmount: number },
  ): Promise<boolean>;
  hasPossibleTransferDuplicate(
    input: ImportTransferTransactionInput,
  ): Promise<boolean>;
}

function dateInvalid(): ValidationError {
  return new ValidationError(
    transactionErrorCodes.dateInvalid,
    getTransactionValidationErrorMessage(transactionErrorCodes.dateInvalid) ??
      "记账时间不正确。",
  );
}

function toImportTransactionTimestamp(value: string, offsetMinutes: number) {
  const timestamp = toTransactionTimestamp(value, offsetMinutes, "import");
  if (!timestamp) throw dateInvalid();
  return timestamp;
}

function sameAmount(left: string, right: number) {
  return Math.abs(Number(left) - right) < 0.000001;
}

function sameTimestamp(left: string, rightIso: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(rightIso);
  return Number.isFinite(leftTime) && leftTime === rightTime;
}

/**
 * 导入专用交易窄接口。写入仍委托正式 TransactionService，因此权限、RLS 与
 * 交易 RPC 的领域校验保持原样；查重复用现有交易读取能力，不新增旁路查询。
 */
export function createTransactionImportService({
  currentLedger,
  service,
}: {
  currentLedger: CurrentLedger;
  service: TransactionService;
}): TransactionImportService {
  async function loadDayItems(
    transactionAtIso: string,
    filters: Parameters<TransactionService["getGroupItems"]>[4],
  ) {
    // getGroupItems 的 "day" 分组按硬编码 JST 边界查询（groupLoaders.ts），
    // 因此查重必须用同一时区推导 day key，不能按本地/UTC 日期猜测。
    const day = getDateKeyInTimeZone(transactionAtIso, serverFallbackTimeZone);
    const items: Awaited<
      ReturnType<TransactionService["getGroupItems"]>
    >["groups"][number]["items"] = [];

    let offset = 0;
    while (true) {
      const page = await service.getGroupItems(
        currentLedger,
        "day",
        day,
        offset,
        filters,
      );
      for (const group of page.groups) items.push(...group.items);
      if (page.nextOffset === null) break;
      offset = page.nextOffset;
    }

    return items;
  }

  return {
    async createNormal(input) {
      const { timeZoneOffsetMinutes, ...transaction } = input;
      await service.createNormal({
        ...transaction,
        transactionAt: toImportTransactionTimestamp(
          input.transactionAt,
          timeZoneOffsetMinutes,
        ),
      });
    },

    async createTransfer(input) {
      const { timeZoneOffsetMinutes, ...transaction } = input;
      await service.createTransfer({
        ...transaction,
        transactionAt: toImportTransactionTimestamp(
          input.transactionAt,
          timeZoneOffsetMinutes,
        ),
      });
    },

    async hasPossibleNormalDuplicate(input) {
      const transactionAtIso = toImportTransactionTimestamp(
        input.transactionAt,
        input.timeZoneOffsetMinutes,
      );
      const items = await loadDayItems(transactionAtIso, {
        accountId: input.accountId,
        merchantId: input.merchantId,
        recordType: input.type,
      });
      return items.some(
        (item) =>
          sameTimestamp(item.transaction_at, transactionAtIso) &&
          sameAmount(item.amount, input.totalAmount),
      );
    },

    async hasPossibleTransferDuplicate(input) {
      const transactionAtIso = toImportTransactionTimestamp(
        input.transactionAt,
        input.timeZoneOffsetMinutes,
      );
      const items = await loadDayItems(transactionAtIso, {
        accountId: input.accountId,
        recordType: "transfer",
      });
      const candidates = items.filter(
        (item) =>
          sameTimestamp(item.transaction_at, transactionAtIso) &&
          sameAmount(item.amount, input.transferAmount),
      );

      for (const candidate of candidates) {
        const view = await service.getEditView(currentLedger, candidate.id);
        if (
          view?.initialValues.type === "transfer" &&
          view.initialValues.accountId === input.accountId &&
          view.initialValues.transferTargetAccountId ===
            input.transferTargetAccountId
        ) {
          return true;
        }
      }
      return false;
    },
  };
}
