import type { Logger } from "internal/shared/logging/logger";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type {
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  LedgerMemberDisplaySettingDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import {
  transactionErrorCodes,
  type TransactionServiceErrorCode,
} from "internal/transaction/errors";
import type {
  TransactionFilterRecordType,
  TransactionGroupBy,
} from "internal/transaction/entity/transactionGrouping";
import type { TransactionSpecialStatusFilterValue } from "internal/transaction/entity/transactionSpecialStatus";
import type { TransactionType } from "internal/transaction/entity/transactionType";
import {
  toTransactionSpecialStatusStorageValue,
  type TransactionSpecialStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import { isThemeColorKey } from "theme/themeColorTokens";

export type TransactionItemInput = {
  amount: number;
  categoryId: string;
  refundedItemId?: string | null;
  reimbursementItemIds?: string[];
  specialStatus?: TransactionSpecialStatus | null;
};

export type CreateNormalTransactionInput = {
  accountId: string;
  items: TransactionItemInput[];
  ledgerId: string;
  merchantId: string;
  note: string | null;
  transactionAt: string;
  type: TransactionType;
};

export type CreateTransferTransactionInput = {
  accountId: string;
  ledgerId: string;
  note: string | null;
  transactionAt: string;
  transferAmount: number;
  transferTargetAccountId: string;
};

export type UpdateNormalTransactionInput = CreateNormalTransactionInput & {
  transactionRecordId: string;
};

export type UpdateTransferTransactionInput = CreateTransferTransactionInput & {
  transactionRecordId: string;
};

export type ConvertTransactionInput =
  | (Omit<UpdateNormalTransactionInput, "type"> & {
      targetType: TransactionType;
    })
  | (UpdateTransferTransactionInput & { targetType: "transfer" });

export type TransactionDashboardSummaryItem = Pick<
  TransactionItemDbRow,
  | "amount"
  | "category_id"
  | "id"
  | "is_refund_income"
  | "is_reimbursement_income"
  | "refunded_amount"
  | "settled_by_item_id"
  | "special_status"
  | "transaction_record_id"
>;

export type TransactionDashboardCategory = Pick<
  CategorySummaryDbRow,
  "id" | "type"
>;

export type TransactionDashboardMonthSource = {
  categories: TransactionDashboardCategory[];
  items: TransactionDashboardSummaryItem[];
};

type TransactionDashboardRecentAccountItem = Pick<
  TransactionItemDbRow,
  "account_id" | "transaction_record_id"
>;

export type TransactionRecordQuery = {
  dateEnd?: string;
  dateStart?: string;
  groupKeyPushDown?: { groupBy: TransactionGroupBy; groupKey: string };
  ledgerId: string;
  limit?: number;
  memberId?: string;
  merchantId?: string;
  offset?: number;
  recordType: TransactionFilterRecordType | "normal";
};

export type TransactionGroupSummaryRow = {
  balance: number | string | null;
  expense: number | string | null;
  group_id: string;
  group_key: string;
  group_label: string;
  income: number | string | null;
  latest_transaction_at: string;
  transaction_count: number | string | null;
};

export type PendingReimbursementItemRow = {
  account_id: string;
  amount: string;
  category_id: string;
  id: string;
  transaction_at: string;
  transaction_record_id: string;
};

export interface TransactionCommandRepository {
  convert(input: ConvertTransactionInput): Promise<void>;
  createNormal(input: CreateNormalTransactionInput): Promise<void>;
  createTransfer(input: CreateTransferTransactionInput): Promise<void>;
  isSpecialStatusEnabled(ledgerId: string): Promise<boolean>;
  findActiveRecord(
    ledgerId: string,
    transactionRecordId: string,
  ): Promise<TransactionRecordDbRow | null>;
  updateNormal(input: UpdateNormalTransactionInput): Promise<void>;
  updateTransfer(input: UpdateTransferTransactionInput): Promise<void>;
  void(ledgerId: string, transactionRecordId: string): Promise<void>;
}

export interface TransactionContextRepository {
  findUserSummaries(
    ledgerId: string,
    userIds: string[],
  ): Promise<AppUserSummaryDbRow[]>;
  listItems(
    ledgerId: string,
    transactionRecordIds: string[],
  ): Promise<TransactionItemDbRow[]>;
  listRecords(input: TransactionRecordQuery): Promise<TransactionRecordDbRow[]>;
}

export interface TransactionFormRepository {
  findActiveRecord(
    ledgerId: string,
    transactionRecordId: string,
  ): Promise<TransactionRecordDbRow | null>;
  listItems(
    ledgerId: string,
    transactionRecordIds: string[],
  ): Promise<TransactionItemDbRow[]>;
  listPendingReimbursementItems(
    ledgerId: string,
  ): Promise<PendingReimbursementItemRow[]>;
}

export interface TransactionFilterOptionsRepository {
  findUserSummaries(
    ledgerId: string,
    userIds: string[],
  ): Promise<AppUserSummaryDbRow[]>;
  listActiveMemberIds(ledgerId: string): Promise<string[]>;
}

export interface TransactionDashboardRepository extends TransactionContextRepository {
  loadDashboardMonthSource(input: {
    dateEnd: string;
    dateStart: string;
    ledgerId: string;
  }): Promise<TransactionDashboardMonthSource>;
  loadDashboardRecentlyUsedAccountIds(input: {
    ledgerId: string;
    limit: number;
  }): Promise<string[]>;
}

export interface TransactionGroupRepository extends TransactionContextRepository {
  loadGroupSummaries(input: {
    accountId?: string;
    categoryId?: string;
    dateEnd?: string;
    dateStart?: string;
    groupBy: TransactionGroupBy;
    ledgerId: string;
    limit: number;
    memberId?: string;
    merchantId?: string;
    offset: number;
    parentCategoryId?: string;
    recordType: TransactionFilterRecordType;
    specialStatuses?: TransactionSpecialStatusFilterValue[];
  }): Promise<TransactionGroupSummaryRow[]>;
}

export interface SupabaseTransactionRepository
  extends
    TransactionCommandRepository,
    TransactionDashboardRepository,
    TransactionFilterOptionsRepository,
    TransactionFormRepository,
    TransactionGroupRepository {}

type RpcError = {
  code?: string | null;
  details?: string | null;
  message?: string | null;
};

const transactionRpcErrorCodes = [
  "not_authenticated",
  "ledger_forbidden",
  transactionErrorCodes.permissionDenied,
  "transaction_not_found",
  "transaction_type_invalid",
  "transaction_at_invalid",
  "items_invalid",
  transactionErrorCodes.accountInvalid,
  transactionErrorCodes.amountInvalid,
  transactionErrorCodes.categoryInvalid,
  transactionErrorCodes.merchantInvalid,
  "transfer_account_invalid",
  "from_account_invalid",
  "to_account_invalid",
  "transfer_currency_invalid",
  "transaction_type_not_changed",
  "reimbursement_item_invalid",
  "reimbursement_income_invalid",
  "income_link_category_invalid",
  "income_link_conflict",
  "refunded_item_invalid",
  "refund_currency_mismatch",
  "refund_account_mismatch",
  "refund_amount_exceeded",
  "reimbursement_currency_mismatch",
  "reimbursement_amount_mismatch",
  "refunded_item_special_status_conflict",
  "special_status_refund_conflict",
  "income_links_create_only",
  "linked_transaction_edit_forbidden",
] as const;

type TransactionRpcErrorCode = (typeof transactionRpcErrorCodes)[number];

function findTransactionRpcErrorCode(
  error: RpcError,
): TransactionRpcErrorCode | null {
  const businessErrorCode = error.details?.trim();
  return transactionRpcErrorCodes.includes(
    businessErrorCode as TransactionRpcErrorCode,
  )
    ? (businessErrorCode as TransactionRpcErrorCode)
    : null;
}

export function createSupabaseTransactionRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): SupabaseTransactionRepository {
  function throwRpcError(
    operation: string,
    fallbackCode: TransactionServiceErrorCode,
    error: RpcError,
    fields: Record<string, unknown>,
  ): never {
    const rpcErrorCode = findTransactionRpcErrorCode(error);

    logger.error(`[transaction] ${operation}`, {
      ...fields,
      databaseCode: error.code,
      databaseDetails: error.details,
      databaseMessage: error.message,
    });

    if (rpcErrorCode === "not_authenticated" || error.code === "28000") {
      throw new AuthenticationError("auth_required", "请先登录。");
    }

    if (
      rpcErrorCode === "ledger_forbidden" ||
      rpcErrorCode === transactionErrorCodes.permissionDenied ||
      error.code === "42501"
    ) {
      throw new AuthorizationError(
        transactionErrorCodes.permissionDenied,
        "没有权限执行此交易操作。",
      );
    }

    if (rpcErrorCode === "transaction_not_found") {
      throw new NotFoundError(
        "transaction_not_found",
        "交易记录不存在或已删除。",
      );
    }

    if (
      rpcErrorCode === transactionErrorCodes.accountInvalid ||
      rpcErrorCode === "transfer_account_invalid" ||
      rpcErrorCode === "from_account_invalid" ||
      rpcErrorCode === "to_account_invalid"
    ) {
      throw new ValidationError(
        transactionErrorCodes.accountInvalid,
        "账户信息不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === "transfer_currency_invalid") {
      throw new ValidationError(
        transactionErrorCodes.accountInvalid,
        "转账账户币种必须一致。",
      );
    }

    if (rpcErrorCode === transactionErrorCodes.merchantInvalid) {
      throw new ValidationError(
        transactionErrorCodes.merchantInvalid,
        "商家信息不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === transactionErrorCodes.categoryInvalid) {
      throw new ValidationError(
        transactionErrorCodes.categoryInvalid,
        "分类信息不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === transactionErrorCodes.amountInvalid) {
      throw new ValidationError(
        transactionErrorCodes.amountInvalid,
        "金额格式不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === "transaction_type_invalid") {
      throw new ValidationError(
        transactionErrorCodes.typeInvalid,
        "交易类型不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === "transaction_at_invalid") {
      throw new ValidationError(
        transactionErrorCodes.dateInvalid,
        "交易时间不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === "items_invalid") {
      throw new ValidationError(
        "items_invalid",
        "交易明细不正确，请确认后重试。",
      );
    }

    if (rpcErrorCode === "transaction_type_not_changed") {
      throw new ValidationError(
        transactionErrorCodes.updateInvalid,
        "交易类型没有发生变化，请刷新页面后重试。",
      );
    }

    if (
      rpcErrorCode === "reimbursement_item_invalid" ||
      rpcErrorCode === "reimbursement_income_invalid"
    ) {
      throw new ConflictError(
        transactionErrorCodes.reimbursementLinkInvalid,
        "待报销明细已被处理或不属于当前账本，请刷新后重试。",
      );
    }

    if (rpcErrorCode === "refund_amount_exceeded") {
      throw new ConflictError(
        transactionErrorCodes.refundAmountExceeded,
        "退款金额超过该明细的剩余可退金额，请调整金额后重试。",
      );
    }

    if (rpcErrorCode === "refunded_item_invalid") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        "退款关联的支出明细无效，请重新选择。",
      );
    }

    if (rpcErrorCode === "refund_currency_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        "退款收入与支出明细的账户币种必须一致。",
      );
    }

    if (rpcErrorCode === "refund_account_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        "退款收入与支出明细必须使用同一账户。",
      );
    }

    if (rpcErrorCode === "reimbursement_currency_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.reimbursementLinkInvalid,
        "报销收入与待报销明细的账户币种必须一致。",
      );
    }

    if (rpcErrorCode === "reimbursement_amount_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.reimbursementLinkInvalid,
        "报销收入金额必须与所选待报销明细合计金额一致。",
      );
    }

    if (rpcErrorCode === "refunded_item_special_status_conflict") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        "该支出明细已处于待报销或已报销状态，不能再建立退款关联。",
      );
    }

    if (rpcErrorCode === "special_status_refund_conflict") {
      throw new ValidationError(
        transactionErrorCodes.reimbursementLinkInvalid,
        "该支出明细已有退款关联，不能再标记为待报销。",
      );
    }

    if (rpcErrorCode === "income_link_category_invalid") {
      throw new ValidationError(
        transactionErrorCodes.incomeLinkCategoryInvalid,
        "只有收入明细才能关联报销或退款。",
      );
    }

    if (rpcErrorCode === "income_link_conflict") {
      throw new ValidationError(
        transactionErrorCodes.incomeLinkConflict,
        "报销关联和退款关联不能同时设置。",
      );
    }

    if (rpcErrorCode === "income_links_create_only") {
      throw new ValidationError(
        transactionErrorCodes.updateInvalid,
        "报销和退款关联只能在新建收入交易时设置。",
      );
    }

    if (rpcErrorCode === "linked_transaction_edit_forbidden") {
      throw new ConflictError(
        transactionErrorCodes.updateInvalid,
        "已有关联报销或退款的交易暂不能修改或作废。",
      );
    }

    if (error.code === "22023") {
      throw new ValidationError(
        rpcErrorCode ?? "transaction_invalid",
        "交易内容不正确，请确认后重试。",
      );
    }

    throw toRepositoryError(fallbackCode, "交易操作失败，请稍后重试。");
  }

  return {
    async convert(input) {
      const rpcParams =
        input.targetType === "transfer"
          ? {
              p_account_id: null,
              p_from_account_id: input.accountId,
              p_items: null,
              p_ledger_id: input.ledgerId,
              p_merchant_id: null,
              p_note: input.note,
              p_target_type: "transfer" as const,
              p_to_account_id: input.transferTargetAccountId,
              p_transaction_at: input.transactionAt,
              p_transaction_record_id: input.transactionRecordId,
              p_transfer_amount: input.transferAmount,
            }
          : {
              p_account_id: input.accountId,
              p_from_account_id: null,
              p_items: toTransactionRpcItems(input.items),
              p_ledger_id: input.ledgerId,
              p_merchant_id: input.merchantId,
              p_note: input.note,
              p_target_type: input.targetType,
              p_to_account_id: null,
              p_transaction_at: input.transactionAt,
              p_transaction_record_id: input.transactionRecordId,
              p_transfer_amount: null,
            };
      const { error } = await supabase.rpc(
        "convert_transaction_type_with_special_status",
        rpcParams,
      );
      if (error) {
        throwRpcError(
          "failed to convert transaction",
          transactionErrorCodes.updateFailed,
          error,
          {
            ledgerId: input.ledgerId,
            transactionRecordId: input.transactionRecordId,
          },
        );
      }
    },

    async createNormal(input) {
      const { error } = await supabase.rpc("create_transaction", {
        p_account_id: input.accountId,
        p_items: toTransactionRpcItems(input.items),
        p_ledger_id: input.ledgerId,
        p_merchant_id: input.merchantId,
        p_note: input.note,
        p_transaction_at: input.transactionAt,
        p_type: input.type,
      });
      if (error) {
        throwRpcError(
          "failed to create transaction",
          transactionErrorCodes.createFailed,
          error,
          { ledgerId: input.ledgerId },
        );
      }
    },

    async createTransfer(input) {
      const { error } = await supabase.rpc("create_transfer_transaction", {
        p_amount: input.transferAmount,
        p_from_account_id: input.accountId,
        p_ledger_id: input.ledgerId,
        p_note: input.note,
        p_to_account_id: input.transferTargetAccountId,
        p_transaction_at: input.transactionAt,
      });
      if (error) {
        throwRpcError(
          "failed to create transfer transaction",
          transactionErrorCodes.createFailed,
          error,
          { ledgerId: input.ledgerId },
        );
      }
    },

    async isSpecialStatusEnabled(ledgerId) {
      const { data, error } = await supabase
        .from("ledger")
        .select("transaction_item_special_status_enabled")
        .eq("id", ledgerId)
        .maybeSingle();
      if (error) {
        logger.error("[transaction] failed to load special status setting", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_special_status_setting_load_failed",
          "账本特殊状态设置读取失败，请稍后重试。",
        );
      }
      return Boolean(data?.transaction_item_special_status_enabled);
    },

    async findActiveRecord(ledgerId, transactionRecordId) {
      const { data, error } = await supabase
        .from("transaction_record")
        .select(
          "id, type, transaction_at, merchant_id, note, created_by, created_at",
        )
        .eq("id", transactionRecordId)
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .in("type", ["normal", "transfer"])
        .maybeSingle();
      if (error) {
        logger.error(
          "[transaction] failed to load transaction permission record",
          {
            databaseCode: error.code,
            ledgerId,
            transactionRecordId,
          },
        );
        throw toRepositoryError(
          transactionErrorCodes.updateFailed,
          "交易记录读取失败，请稍后重试。",
        );
      }
      return data as TransactionRecordDbRow | null;
    },

    async findUserSummaries(ledgerId, userIds) {
      const uniqueUserIds = [...new Set(userIds)];
      if (uniqueUserIds.length === 0) return [];
      const [userResult, settingResult] = await Promise.all([
        supabase
          .from("app_user")
          .select("id, display_name")
          .in("id", uniqueUserIds),
        supabase
          .from("ledger_member_display_setting")
          .select("user_id, display_name, display_color")
          .eq("ledger_id", ledgerId)
          .in("user_id", uniqueUserIds),
      ]);
      if (userResult.error || settingResult.error) {
        logger.error("[transaction] failed to load transaction recorders", {
          ledgerId,
          userDatabaseCode: userResult.error?.code,
          settingDatabaseCode: settingResult.error?.code,
        });
        throw toRepositoryError(
          "transaction_recorders_load_failed",
          "交易记录人信息加载失败，请稍后重试。",
        );
      }
      const settingByUserId = new Map(
        (settingResult.data ?? []).map((setting) => [
          setting.user_id,
          setting as LedgerMemberDisplaySettingDbRow,
        ]),
      );
      return (userResult.data ?? []).map((user) => {
        const setting = settingByUserId.get(user.id);
        const displayName = setting?.display_name?.trim();
        return {
          display_color:
            setting?.display_color && isThemeColorKey(setting.display_color)
              ? setting.display_color
              : null,
          display_name: displayName || user.display_name,
          id: user.id,
        };
      });
    },

    async listActiveMemberIds(ledgerId) {
      const { data, error } = await supabase
        .from("ledger_member")
        .select("user_id")
        .eq("ledger_id", ledgerId)
        .eq("status", "active");
      if (error) {
        logger.error("[transaction] failed to load active members", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_members_load_failed",
          "账本成员加载失败，请稍后重试。",
        );
      }
      return (data ?? []).map((row) => row.user_id);
    },

    async listItems(ledgerId, transactionRecordIds) {
      const uniqueIds = [...new Set(transactionRecordIds)];
      if (uniqueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transaction_item_with_refund")
        .select(
          "id, transaction_record_id, account_id, category_id, amount, balance_delta, note, special_status, settled_by_item_id, refunded_amount, is_refund_income, is_reimbursement_income, has_refund_link",
        )
        .eq("ledger_id", ledgerId)
        .in("transaction_record_id", uniqueIds)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });
      if (error) {
        logger.error("[transaction] failed to load transaction items", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_items_load_failed",
          "交易明细加载失败，请稍后重试。",
        );
      }
      return (data ?? []) as TransactionItemDbRow[];
    },

    async listPendingReimbursementItems(ledgerId) {
      const { data: itemData, error: itemError } = await supabase
        .from("transaction_item")
        .select("id, transaction_record_id, account_id, category_id, amount")
        .eq("ledger_id", ledgerId)
        .eq("special_status", "pending_reimbursement")
        .is("settled_by_item_id", null)
        .order("created_at", { ascending: false });
      if (itemError) {
        logger.error("[transaction] failed to load pending reimbursements", {
          databaseCode: itemError.code,
          ledgerId,
        });
        throw toRepositoryError(
          "pending_reimbursements_load_failed",
          "待报销明细加载失败，请稍后重试。",
        );
      }

      const recordIds = [
        ...new Set((itemData ?? []).map((item) => item.transaction_record_id)),
      ];
      if (recordIds.length === 0) return [];
      const { data: recordData, error: recordError } = await supabase
        .from("transaction_record")
        .select("id, transaction_at")
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .in("id", recordIds);
      if (recordError) {
        logger.error("[transaction] failed to load reimbursement records", {
          databaseCode: recordError.code,
          ledgerId,
        });
        throw toRepositoryError(
          "pending_reimbursements_load_failed",
          "待报销明细加载失败，请稍后重试。",
        );
      }
      const transactionAtById = new Map(
        (recordData ?? []).map((record) => [record.id, record.transaction_at]),
      );
      return (itemData ?? []).flatMap((item) => {
        const transactionAt = transactionAtById.get(item.transaction_record_id);
        if (!transactionAt || !item.category_id) return [];
        return [
          {
            ...item,
            category_id: item.category_id,
            transaction_at: transactionAt,
          },
        ];
      });
    },

    async loadDashboardRecentlyUsedAccountIds({ ledgerId, limit }) {
      const { data: recordData, error: recordError } = await supabase
        .from("transaction_record")
        .select("id")
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .in("type", ["normal", "transfer"])
        .order("transaction_at", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, limit - 1);

      if (recordError) {
        logger.error(
          "[transaction] failed to load dashboard recent account records",
          {
            databaseCode: recordError.code,
            ledgerId,
          },
        );
        throw toRepositoryError(
          "transaction_dashboard_recent_accounts_load_failed",
          "最近使用账户加载失败，请稍后重试。",
        );
      }

      const recordIds = (recordData ?? []).map((record) => record.id);
      if (recordIds.length === 0) return [];

      const { data: itemData, error: itemError } = await supabase
        .from("transaction_item")
        .select("transaction_record_id, account_id")
        .eq("ledger_id", ledgerId)
        .in("transaction_record_id", recordIds)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (itemError) {
        logger.error(
          "[transaction] failed to load dashboard recent account items",
          {
            databaseCode: itemError.code,
            ledgerId,
          },
        );
        throw toRepositoryError(
          "transaction_dashboard_recent_accounts_load_failed",
          "最近使用账户加载失败，请稍后重试。",
        );
      }

      const items = (itemData ?? []) as TransactionDashboardRecentAccountItem[];
      const accountIdsByRecordId = new Map<string, string[]>();
      for (const item of items) {
        const accountIds =
          accountIdsByRecordId.get(item.transaction_record_id) ?? [];
        accountIds.push(item.account_id);
        accountIdsByRecordId.set(item.transaction_record_id, accountIds);
      }

      const recentlyUsedAccountIds = new Set<string>();
      for (const recordId of recordIds) {
        for (const accountId of accountIdsByRecordId.get(recordId) ?? []) {
          recentlyUsedAccountIds.add(accountId);
        }
      }
      return [...recentlyUsedAccountIds];
    },

    async loadDashboardMonthSource({ dateEnd, dateStart, ledgerId }) {
      const { data: recordData, error: recordError } = await supabase
        .from("transaction_record")
        .select("id")
        .eq("ledger_id", ledgerId)
        .eq("status", "active")
        .eq("type", "normal")
        .gte("transaction_at", dateStart)
        .lt("transaction_at", dateEnd);

      if (recordError) {
        logger.error("[transaction] failed to load dashboard month records", {
          databaseCode: recordError.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_dashboard_summary_load_failed",
          "本月收支汇总加载失败，请稍后重试。",
        );
      }

      const recordIds = (recordData ?? []).map((record) => record.id);
      if (recordIds.length === 0) return { categories: [], items: [] };

      const { data: itemData, error: itemError } = await supabase
        .from("transaction_item_with_refund")
        .select(
          "id, transaction_record_id, category_id, amount, special_status, settled_by_item_id, refunded_amount, is_refund_income, is_reimbursement_income",
        )
        .eq("ledger_id", ledgerId)
        .in("transaction_record_id", recordIds);

      if (itemError) {
        logger.error("[transaction] failed to load dashboard month items", {
          databaseCode: itemError.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_dashboard_summary_load_failed",
          "本月收支汇总加载失败，请稍后重试。",
        );
      }

      const items = (itemData ?? []) as TransactionDashboardSummaryItem[];
      const categoryIds = [
        ...new Set(
          items
            .map((item) => item.category_id)
            .filter((categoryId): categoryId is string => categoryId !== null),
        ),
      ];
      if (categoryIds.length === 0) return { categories: [], items };

      const { data: categoryData, error: categoryError } = await supabase
        .from("category")
        .select("id, type")
        .eq("ledger_id", ledgerId)
        .in("id", categoryIds);

      if (categoryError) {
        logger.error(
          "[transaction] failed to load dashboard month category types",
          {
            databaseCode: categoryError.code,
            ledgerId,
          },
        );
        throw toRepositoryError(
          "transaction_dashboard_summary_load_failed",
          "本月收支汇总加载失败，请稍后重试。",
        );
      }

      return {
        categories: (categoryData ?? []) as TransactionDashboardCategory[],
        items,
      };
    },

    async listRecords(input) {
      let query = supabase
        .from("transaction_record")
        .select(
          "id, type, transaction_at, merchant_id, note, created_by, created_at",
        )
        .eq("ledger_id", input.ledgerId)
        .eq("status", "active")
        .in("type", ["normal", "transfer"]);
      if (input.dateStart) query = query.gte("transaction_at", input.dateStart);
      if (input.dateEnd) query = query.lt("transaction_at", input.dateEnd);
      if (input.recordType === "transfer") query = query.eq("type", "transfer");
      if (
        input.recordType === "normal" ||
        input.recordType === "income" ||
        input.recordType === "expense" ||
        input.recordType === "refundableExpense"
      ) {
        query = query.eq("type", "normal");
      }
      if (input.merchantId) {
        query = query.eq("merchant_id", input.merchantId);
      } else if (input.groupKeyPushDown?.groupBy === "merchant") {
        query =
          input.groupKeyPushDown.groupKey === "unknown"
            ? query.is("merchant_id", null)
            : query.eq("merchant_id", input.groupKeyPushDown.groupKey);
      }
      if (input.memberId) {
        query = query.eq("created_by", input.memberId);
      } else if (input.groupKeyPushDown?.groupBy === "member") {
        query =
          input.groupKeyPushDown.groupKey === "unknown"
            ? query.is("created_by", null)
            : query.eq("created_by", input.groupKeyPushDown.groupKey);
      }
      query = query
        .order("transaction_at", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (input.limit !== undefined) {
        const offset = Math.max(0, input.offset ?? 0);
        query = query.range(offset, offset + input.limit - 1);
      }
      const { data, error } = await query;
      if (error) {
        logger.error("[transaction] failed to load transaction records", {
          databaseCode: error.code,
          ledgerId: input.ledgerId,
        });
        throw toRepositoryError(
          "transaction_records_load_failed",
          "交易记录加载失败，请稍后重试。",
        );
      }
      return (data ?? []) as TransactionRecordDbRow[];
    },

    async loadGroupSummaries(input) {
      const { data, error } = await supabase.rpc(
        "load_transaction_group_summaries_with_special_status",
        {
          p_account_id: input.accountId ?? null,
          p_category_id: input.categoryId ?? null,
          p_date_end: input.dateEnd ?? null,
          p_date_start: input.dateStart ?? null,
          p_group_by: input.groupBy,
          p_ledger_id: input.ledgerId,
          p_limit: input.limit,
          p_member_id: input.memberId ?? null,
          p_merchant_id: input.merchantId ?? null,
          p_offset: input.offset,
          p_parent_category_id: input.parentCategoryId ?? null,
          p_record_type: input.recordType,
          p_special_statuses: input.specialStatuses?.map((status) =>
            toTransactionSpecialStatusStorageValue(status),
          ),
        },
      );
      if (error) {
        logger.error("[transaction] failed to load group summaries", {
          databaseCode: error.code,
          groupBy: input.groupBy,
          ledgerId: input.ledgerId,
        });
        throw toRepositoryError(
          "transaction_group_summaries_load_failed",
          "交易分组加载失败，请稍后重试。",
        );
      }
      return (data ?? []) as TransactionGroupSummaryRow[];
    },

    async updateNormal(input) {
      const { error } = await supabase.rpc("update_transaction", {
        p_account_id: input.accountId,
        p_items: toTransactionRpcItems(input.items),
        p_ledger_id: input.ledgerId,
        p_merchant_id: input.merchantId,
        p_note: input.note,
        p_transaction_at: input.transactionAt,
        p_transaction_record_id: input.transactionRecordId,
        p_type: input.type,
      });
      if (error) {
        throwRpcError(
          "failed to update transaction",
          transactionErrorCodes.updateFailed,
          error,
          {
            ledgerId: input.ledgerId,
            transactionRecordId: input.transactionRecordId,
          },
        );
      }
    },

    async updateTransfer(input) {
      const { error } = await supabase.rpc("update_transfer_transaction", {
        p_amount: input.transferAmount,
        p_from_account_id: input.accountId,
        p_ledger_id: input.ledgerId,
        p_note: input.note,
        p_to_account_id: input.transferTargetAccountId,
        p_transaction_at: input.transactionAt,
        p_transaction_record_id: input.transactionRecordId,
      });
      if (error) {
        throwRpcError(
          "failed to update transfer transaction",
          transactionErrorCodes.updateFailed,
          error,
          {
            ledgerId: input.ledgerId,
            transactionRecordId: input.transactionRecordId,
          },
        );
      }
    },

    async void(ledgerId, transactionRecordId) {
      const { error } = await supabase.rpc("void_transaction", {
        p_ledger_id: ledgerId,
        p_transaction_record_id: transactionRecordId,
      });
      if (error) {
        throwRpcError(
          "failed to void transaction",
          transactionErrorCodes.voidFailed,
          error,
          { ledgerId, transactionRecordId },
        );
      }
    },
  };
}

function toTransactionRpcItems(items: TransactionItemInput[]) {
  return items.map((item) => ({
    amount: item.amount,
    categoryId: item.categoryId,
    refundedItemId: item.refundedItemId ?? null,
    reimbursementItemIds: item.reimbursementItemIds ?? [],
    specialStatus: toTransactionSpecialStatusStorageValue(
      item.specialStatus ?? null,
    ),
  }));
}
