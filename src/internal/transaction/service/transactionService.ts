import {
  canModifyTransaction,
  canWriteTransaction,
} from "lib/ledger/permissions";
import type { CurrentLedger } from "lib/ledger/current-ledger";
import type { AccountQueryService } from "internal/account";
import type { CategoryQueryService } from "internal/category";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import type { MerchantQueryService } from "internal/merchant";
import {
  AuthorizationError,
  NotFoundError,
  RepositoryError,
} from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";
import type {
  EditTransactionView,
  NewTransactionView,
} from "internal/transaction/entity/transactionView";
import type {
  ConvertTransactionInput,
  CreateNormalTransactionInput,
  CreateTransferTransactionInput,
  TransactionRepository,
  UpdateNormalTransactionInput,
  UpdateTransferTransactionInput,
} from "internal/transaction/repository/transactionRepository";
import {
  loadStep4TransactionGroupItems,
  loadStep4TransactionGroupPage,
  loadStep4TransactionGroupView,
} from "internal/transaction/service/read/groupLoaders";
import {
  getEditTransactionView,
  getNewTransactionView,
} from "internal/transaction/service/read/transactionFormService";
import {
  buildTransactionListItemsFromContext,
  loadTransactionGroupLoaderContext,
} from "internal/transaction/service/read/transactionContext";
import {
  getTransactionReadDependencies,
  requireTransactionReadLedger,
  requireTransactionUserId,
  type TransactionReadAccessDependencies,
} from "internal/transaction/service/read/transactionReadAccess";
import { loadTransactionFilterOptions } from "internal/transaction/service/read/options";
import {
  buildTransactionSearchPage,
  emptyTransactionSearchPage,
  normalizeTransactionSearchQuery,
} from "internal/transaction/util/transactionSearchHelpers";
import type {
  TransactionFilters,
  TransactionGroupBy,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import { defaultTransactionFilters } from "types/transactions";

export type TransactionServiceDependencies = {
  accountQueryService: AccountQueryService;
  categoryQueryService: CategoryQueryService;
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  merchantQueryService: MerchantQueryService;
  transactionRepository: TransactionRepository;
};

export interface TransactionService {
  canModify(input: {
    ledgerId: string;
    transactionRecordId: string;
  }): Promise<boolean>;
  convert(input: ConvertTransactionInput): Promise<void>;
  createNormal(input: CreateNormalTransactionInput): Promise<void>;
  createTransfer(input: CreateTransferTransactionInput): Promise<void>;
  getEditView(
    currentLedger: CurrentLedger,
    transactionRecordId: string,
  ): Promise<EditTransactionView | null>;
  getFilterOptions(
    currentLedger: CurrentLedger,
  ): ReturnType<typeof loadTransactionFilterOptions>;
  getGroupItems(
    currentLedger: CurrentLedger,
    groupBy: TransactionGroupBy,
    groupKey: string,
    offset: number,
    filters?: TransactionFilters,
  ): Promise<TransactionMonthPage>;
  getGroupPage(
    currentLedger: CurrentLedger,
    groupBy: TransactionGroupBy,
    offset: number,
    filters?: TransactionFilters,
  ): Promise<TransactionGroupPage>;
  getGroupView(
    currentLedger: CurrentLedger,
    groupBy?: TransactionGroupBy,
    filters?: TransactionFilters,
  ): Promise<TransactionTimeGroupViewData>;
  getNewView(currentLedger: CurrentLedger): Promise<NewTransactionView>;
  search(
    currentLedger: CurrentLedger,
    rawQuery: string,
    offset?: number,
  ): Promise<TransactionSearchPage>;
  updateNormal(input: UpdateNormalTransactionInput): Promise<void>;
  updateTransfer(input: UpdateTransferTransactionInput): Promise<void>;
  void(input: { ledgerId: string; transactionRecordId: string }): Promise<void>;
}

function permissionError(): AuthorizationError {
  return new AuthorizationError(
    transactionErrorCodes.permissionDenied,
    "没有权限执行此交易操作。",
  );
}

function operationError(error: unknown, fallbackCode: string): never {
  if (error instanceof RepositoryError) {
    throw new RepositoryError(fallbackCode, "交易操作失败，请稍后重试。");
  }
  throw error;
}

/**
 * Transaction UseCase。成员资格、角色与创建者权限均在 Service 独立校验，
 * 不依赖 Router middleware 或数据库 RPC 的隐式权限检查。
 */
export function createTransactionService({
  accountQueryService,
  categoryQueryService,
  currentUserId,
  ledgerAccessService,
  merchantQueryService,
  transactionRepository,
}: TransactionServiceDependencies): TransactionService {
  const readAccessDependencies: TransactionReadAccessDependencies = {
    accountQueryService,
    categoryQueryService,
    currentUserId,
    ledgerAccessService,
    merchantQueryService,
    transactionRepository,
  };

  async function requireWritePermission(ledgerId: string) {
    const userId = requireTransactionUserId(currentUserId);
    const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
      ledgerId,
      userId,
    });
    if (!canWriteTransaction(role)) throw permissionError();
    return { role, userId };
  }

  const requireReadLedger = (currentLedger: CurrentLedger) =>
    requireTransactionReadLedger(readAccessDependencies, currentLedger);

  const getReadDependencies = () =>
    getTransactionReadDependencies(readAccessDependencies);

  async function requireModificationPermission(
    ledgerId: string,
    transactionRecordId: string,
  ) {
    const { role, userId } = await requireWritePermission(ledgerId);
    const record = await transactionRepository.findActiveRecord(
      ledgerId,
      transactionRecordId,
    );
    if (!record) {
      throw new NotFoundError(
        transactionErrorCodes.updateInvalid,
        "交易记录不存在或已删除。",
      );
    }
    if (
      !canModifyTransaction({
        createdBy: record.created_by ?? null,
        role,
        userId,
      })
    ) {
      throw permissionError();
    }
  }

  return {
    async canModify({ ledgerId, transactionRecordId }) {
      try {
        await requireModificationPermission(ledgerId, transactionRecordId);
        return true;
      } catch (error) {
        if (
          error instanceof AuthorizationError ||
          error instanceof NotFoundError
        ) {
          return false;
        }
        throw error;
      }
    },

    async convert(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      try {
        await transactionRepository.convert(input);
      } catch (error) {
        operationError(error, transactionErrorCodes.updateFailed);
      }
    },

    async createNormal(input) {
      await requireWritePermission(input.ledgerId);
      try {
        await transactionRepository.createNormal(input);
      } catch (error) {
        operationError(error, transactionErrorCodes.createFailed);
      }
    },

    async createTransfer(input) {
      await requireWritePermission(input.ledgerId);
      try {
        await transactionRepository.createTransfer(input);
      } catch (error) {
        operationError(error, transactionErrorCodes.createFailed);
      }
    },

    async getEditView(currentLedger, transactionRecordId) {
      return getEditTransactionView(
        getReadDependencies(),
        await requireReadLedger(currentLedger),
        transactionRecordId,
      );
    },

    async getFilterOptions(currentLedger) {
      return loadTransactionFilterOptions(
        getReadDependencies(),
        await requireReadLedger(currentLedger),
      );
    },

    async getGroupItems(
      currentLedger,
      groupBy,
      groupKey,
      offset,
      filters = defaultTransactionFilters,
    ) {
      return loadStep4TransactionGroupItems(
        getReadDependencies(),
        await requireReadLedger(currentLedger),
        groupBy,
        groupKey,
        offset,
        filters,
      );
    },

    async getGroupPage(
      currentLedger,
      groupBy,
      offset,
      filters = defaultTransactionFilters,
    ) {
      return loadStep4TransactionGroupPage(
        getReadDependencies(),
        await requireReadLedger(currentLedger),
        groupBy,
        offset,
        filters,
      );
    },

    async getGroupView(
      currentLedger,
      groupBy = "month",
      filters = defaultTransactionFilters,
    ) {
      return loadStep4TransactionGroupView(
        getReadDependencies(),
        await requireReadLedger(currentLedger),
        groupBy,
        filters,
      );
    },

    async getNewView(currentLedger) {
      return getNewTransactionView(
        getReadDependencies(),
        await requireReadLedger(currentLedger),
      );
    },

    async search(currentLedger, rawQuery, offset = 0) {
      const query = normalizeTransactionSearchQuery(rawQuery);
      if (!query) return emptyTransactionSearchPage;
      const ledger = await requireReadLedger(currentLedger);
      const context = await loadTransactionGroupLoaderContext(
        getReadDependencies(),
        ledger,
      );
      return buildTransactionSearchPage(
        buildTransactionListItemsFromContext(context.records, context),
        query,
        offset,
      );
    },

    async updateNormal(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      try {
        await transactionRepository.updateNormal(input);
      } catch (error) {
        operationError(error, transactionErrorCodes.updateFailed);
      }
    },

    async updateTransfer(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      try {
        await transactionRepository.updateTransfer(input);
      } catch (error) {
        operationError(error, transactionErrorCodes.updateFailed);
      }
    },

    async void({ ledgerId, transactionRecordId }) {
      await requireModificationPermission(ledgerId, transactionRecordId);
      try {
        await transactionRepository.void(ledgerId, transactionRecordId);
      } catch (error) {
        operationError(error, transactionErrorCodes.voidFailed);
      }
    },
  };
}
