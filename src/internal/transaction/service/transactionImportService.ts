import type { TransactionPayment } from "internal/transaction/entity/transactionPayment";
import { ValidationError } from "internal/shared/errors/appError";
import {
  transactionErrorCodes,
  transactionValidationErrorMessages,
} from "internal/transaction/errors";
import type { TransactionService } from "internal/transaction/service/transactionService";
import { toTransactionTimestamp } from "internal/transaction/util/transactionTimestamp";

export type ImportTransactionItemInput = {
  amount: number;
  categoryId: string;
};

export type ImportNormalTransactionInput = {
  attachmentIds?: string[];
  payments: TransactionPayment[];
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
  transferFeeAmount?: number | null;
  transferTargetAmount?: number;
  transferTargetAccountId: string;
};

export type ImportBalanceAdjustmentInput = Omit<
  ImportTransferTransactionInput,
  "transferAmount" | "transferTargetAmount" | "transferTargetAccountId"
> & { signedDelta: number };

export interface TransactionImportService {
  createBalanceAdjustment(input: ImportBalanceAdjustmentInput): Promise<void>;
  createNormal(input: ImportNormalTransactionInput): Promise<void>;
  createTransfer(input: ImportTransferTransactionInput): Promise<void>;
}

function dateInvalid(): ValidationError {
  return new ValidationError(
    transactionErrorCodes.dateInvalid,
    transactionValidationErrorMessages[transactionErrorCodes.dateInvalid],
  );
}

function toImportTransactionTimestamp(value: string, offsetMinutes: number) {
  const timestamp = toTransactionTimestamp(value, offsetMinutes, "import");
  if (!timestamp) throw dateInvalid();
  return timestamp;
}

/**
 * 导入专用交易窄接口。写入仍委托正式 TransactionService，因此权限、RLS 与
 * 交易 RPC 的领域校验保持原样。
 */
export function createTransactionImportService({
  service,
}: {
  service: TransactionService;
}): TransactionImportService {
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

    async createBalanceAdjustment(input) {
      const { timeZoneOffsetMinutes, ...transaction } = input;
      await service.createBalanceAdjustment({
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

  };
}
