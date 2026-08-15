import { canModifyTransaction, canWriteTransaction } from "internal/ledger";
import type { CurrentLedger } from "internal/ledger";
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
  ValidationError,
} from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";
import { toRefundMinorUnits } from "internal/transaction/util/refundAllocation";
import type {
  TransactionFilters,
  TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";
import { defaultTransactionFilters } from "internal/transaction/entity/transactionGrouping";
import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionSearchPage,
} from "internal/transaction/entity/transactionReadModels";
import type { TransactionIncomeLinkRepository } from "internal/transaction/repository/transactionIncomeLinkRepository";
import type {
  ConvertTransactionInput,
  CreateNormalTransactionInput,
  CreateTransferTransactionInput,
  TransactionCommandRepository,
  TransactionFilterOptionsRepository,
  TransactionFormRepository,
  TransactionGroupRepository,
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
  filterTransactionItems,
  filterTransactionRecords,
} from "internal/transaction/util/grouping/filters";
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
  EditTransactionView,
  NewTransactionView,
  TransactionFilterOptions,
  TransactionTimeGroupViewData,
} from "internal/transaction/service/read/transactionReadModels";

export type TransactionServiceDependencies = {
  accountQueryService: AccountQueryService;
  categoryQueryService: CategoryQueryService;
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  merchantQueryService: MerchantQueryService;
  transactionIncomeLinkRepository?: TransactionIncomeLinkRepository;
  transactionRepository: TransactionCommandRepository &
    TransactionFilterOptionsRepository &
    TransactionFormRepository &
    TransactionGroupRepository;
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
  ): Promise<TransactionFilterOptions>;
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
    filters?: TransactionFilters,
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
  transactionIncomeLinkRepository,
  transactionRepository,
}: TransactionServiceDependencies): TransactionService {
  const readAccessDependencies: TransactionReadAccessDependencies<
    TransactionCommandRepository &
      TransactionFilterOptionsRepository &
      TransactionFormRepository &
      TransactionGroupRepository
  > = {
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

  const getReadDependencies = () => ({
    ...getTransactionReadDependencies(readAccessDependencies),
    transactionIncomeLinkRepository,
  });

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

  async function validateSpecialStatuses(input: {
    items: CreateNormalTransactionInput["items"];
    ledgerId: string;
  }) {
    const hasSpecialStatusInput = input.items.some(
      (item) =>
        (item.specialStatus !== undefined && item.specialStatus !== null) ||
        Boolean(item.reimbursementItemId) ||
        Boolean(item.refundAllocations?.length),
    );
    if (
      hasSpecialStatusInput &&
      !(await transactionRepository.isSpecialStatusEnabled(input.ledgerId))
    ) {
      throw new ValidationError(
        transactionErrorCodes.specialStatusInvalid,
        "当前账本未启用特殊状态功能。",
      );
    }

    if (input.items.some((item) => item.specialStatus === "reimbursed")) {
      throw new ValidationError(
        transactionErrorCodes.specialStatusInvalid,
        "已报销状态只能通过收入的报销关联自动设置。",
      );
    }
    const categoryIds = [
      ...new Set(input.items.map((item) => item.categoryId)),
    ];

    const categories = await categoryQueryService.findSummariesByIds({
      categoryIds,
      ledgerId: input.ledgerId,
      userId: requireTransactionUserId(currentUserId),
    });
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    for (const item of input.items) {
      const categoryType = categoryById.get(item.categoryId)?.type;
      if (
        item.specialStatus === "pendingReimbursement" &&
        categoryType !== "expense"
      ) {
        throw new ValidationError(
          transactionErrorCodes.specialStatusInvalid,
          "待报销只能用于支出明细。",
        );
      }
      const hasReimbursementLink = Boolean(item.reimbursementItemId);
      const hasRefundLink = Boolean(item.refundAllocations?.length);
      if (
        (hasReimbursementLink || hasRefundLink) &&
        categoryType !== "income"
      ) {
        throw new ValidationError(
          transactionErrorCodes.specialStatusInvalid,
          "报销或退款关联只能设置在收入明细上。",
        );
      }
      if (hasReimbursementLink && hasRefundLink) {
        throw new ValidationError(
          transactionErrorCodes.specialStatusInvalid,
          "同一条收入明细不能同时作为报销和退款。",
        );
      }
      if (hasRefundLink) {
        const allocations = item.refundAllocations ?? [];
        const targetIds = new Set(
          allocations.map((allocation) => allocation.refundedItemId),
        );
        const allocationUnits = allocations.map((allocation) =>
          toRefundMinorUnits(allocation.refundAmount),
        );
        const itemAmountUnits = toRefundMinorUnits(item.amount);
        if (
          targetIds.size !== allocations.length ||
          itemAmountUnits === null ||
          allocationUnits.some(
            (units) => units === null || units <= BigInt(0),
          ) ||
          (allocationUnits as bigint[]).reduce(
            (sum, units) => sum + units,
            BigInt(0),
          ) > itemAmountUnits
        ) {
          throw new ValidationError(
            transactionErrorCodes.refundLinkInvalid,
            "退款分摊金额不正确，请重新选择退款明细。",
          );
        }
      }
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
      if (input.targetType !== "transfer") {
        await validateSpecialStatuses(input);
      }
      try {
        await transactionRepository.convert(input);
      } catch (error) {
        operationError(error, transactionErrorCodes.updateFailed);
      }
    },

    async createNormal(input) {
      await requireWritePermission(input.ledgerId);
      await validateSpecialStatuses(input);
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

    async search(
      currentLedger,
      rawQuery,
      offset = 0,
      filters = defaultTransactionFilters,
    ) {
      const query = normalizeTransactionSearchQuery(rawQuery);
      if (!query) return emptyTransactionSearchPage;
      const ledger = await requireReadLedger(currentLedger);
      const context = await loadTransactionGroupLoaderContext(
        getReadDependencies(),
        ledger,
      );
      const records = filterTransactionRecords(context, filters);
      const recordIds = new Set(records.map((record) => record.id));
      const filteredContext = {
        ...context,
        items: filterTransactionItems(context, filters).filter((item) =>
          recordIds.has(item.transaction_record_id),
        ),
      };
      return buildTransactionSearchPage(
        buildTransactionListItemsFromContext(records, filteredContext),
        query,
        offset,
      );
    },

    async updateNormal(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      await validateSpecialStatuses(input);
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
