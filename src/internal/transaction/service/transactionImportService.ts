import type { CurrentLedger } from "internal/ledger";
import type { TransactionService } from "internal/transaction/service/transactionService";

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
  transactionAt: string;
  type: "expense" | "income";
};

export type ImportTransferTransactionInput = {
  accountId: string;
  ledgerId: string;
  note: string | null;
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

function normalizeTransactionAt(value: string) {
  return value.replace("T", " ").slice(0, 19);
}

function sameAmount(left: string, right: number) {
  return Math.abs(Number(left) - right) < 0.000001;
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
    transactionAt: string,
    filters: Parameters<TransactionService["getGroupItems"]>[4],
  ) {
    const day = transactionAt.slice(0, 10);
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
      await service.createNormal(input);
    },

    async createTransfer(input) {
      await service.createTransfer(input);
    },

    async hasPossibleNormalDuplicate(input) {
      const items = await loadDayItems(input.transactionAt, {
        accountId: input.accountId,
        merchantId: input.merchantId,
        recordType: input.type,
      });
      return items.some(
        (item) =>
          normalizeTransactionAt(item.transaction_at) === input.transactionAt &&
          sameAmount(item.amount, input.totalAmount),
      );
    },

    async hasPossibleTransferDuplicate(input) {
      const items = await loadDayItems(input.transactionAt, {
        accountId: input.accountId,
        recordType: "transfer",
      });
      const candidates = items.filter(
        (item) =>
          normalizeTransactionAt(item.transaction_at) === input.transactionAt &&
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
