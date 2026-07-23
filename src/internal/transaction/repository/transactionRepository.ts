import type { Logger } from "internal/shared/logging/logger";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import type {
  AppUserSummaryDbRow,
  LedgerMemberDisplaySettingDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
  TransactionTagDbRow,
} from "internal/db-types";
import {
  transactionErrorCodes,
  type TransactionServiceErrorCode,
} from "internal/transaction/errors";
import { isThemeColorKey } from "theme/themeColorTokens";
import type {
  TransactionFilterRecordType,
  TransactionGroupBy,
  TransactionType,
} from "types/transactions";

export type TransactionItemInput = {
  amount: number;
  categoryId: string;
};

export type CreateNormalTransactionInput = {
  accountId: string;
  items: TransactionItemInput[];
  ledgerId: string;
  merchantId: string;
  note: string | null;
  tagNames: string[];
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

export type RawTagAssignment = {
  tag_id: string;
  transaction_record_id: string;
};

export type TransactionRecordQuery = {
  dateEnd?: string;
  dateStart?: string;
  groupKeyPushDown?: { groupBy: TransactionGroupBy; groupKey: string };
  ledgerId: string;
  limit?: number;
  memberId?: string;
  merchantId?: string;
  offset?: number;
  recordType: TransactionFilterRecordType;
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

export interface TransactionRepository {
  convert(input: ConvertTransactionInput): Promise<void>;
  createNormal(input: CreateNormalTransactionInput): Promise<void>;
  createTransfer(input: CreateTransferTransactionInput): Promise<void>;
  findActiveRecord(
    ledgerId: string,
    transactionRecordId: string,
  ): Promise<TransactionRecordDbRow | null>;
  findUserSummaries(
    ledgerId: string,
    userIds: string[],
  ): Promise<AppUserSummaryDbRow[]>;
  listActiveMemberIds(ledgerId: string): Promise<string[]>;
  listActiveTags(ledgerId: string): Promise<TransactionTagDbRow[]>;
  listItems(
    ledgerId: string,
    transactionRecordIds: string[],
  ): Promise<TransactionItemDbRow[]>;
  listRecords(input: TransactionRecordQuery): Promise<TransactionRecordDbRow[]>;
  listTagAssignments(
    ledgerId: string,
    transactionRecordIds: string[],
  ): Promise<RawTagAssignment[]>;
  listTagsByIds(
    ledgerId: string,
    tagIds: string[],
  ): Promise<TransactionTagDbRow[]>;
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
    tagId?: string;
  }): Promise<TransactionGroupSummaryRow[]>;
  updateNormal(input: UpdateNormalTransactionInput): Promise<void>;
  updateTransfer(input: UpdateTransferTransactionInput): Promise<void>;
  void(ledgerId: string, transactionRecordId: string): Promise<void>;
}

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
] as const;

type TransactionRpcErrorCode = (typeof transactionRpcErrorCodes)[number];

function findTransactionRpcErrorCode(
  error: RpcError,
): TransactionRpcErrorCode | null {
  const messages = [error.details, error.message]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const code of transactionRpcErrorCodes) {
    if (
      messages.some((message) => message === code || message.includes(code))
    ) {
      return code;
    }
  }

  return null;
}

export function createSupabaseTransactionRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): TransactionRepository {
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
              p_tag_names: [],
              p_target_type: "transfer" as const,
              p_to_account_id: input.transferTargetAccountId,
              p_transaction_at: input.transactionAt,
              p_transaction_record_id: input.transactionRecordId,
              p_transfer_amount: input.transferAmount,
            }
          : {
              p_account_id: input.accountId,
              p_from_account_id: null,
              p_items: input.items,
              p_ledger_id: input.ledgerId,
              p_merchant_id: input.merchantId,
              p_note: input.note,
              p_tag_names: input.tagNames,
              p_target_type: input.targetType,
              p_to_account_id: null,
              p_transaction_at: input.transactionAt,
              p_transaction_record_id: input.transactionRecordId,
              p_transfer_amount: null,
            };
      const { error } = await supabase.rpc(
        "convert_transaction_type",
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
        p_items: input.items,
        p_ledger_id: input.ledgerId,
        p_merchant_id: input.merchantId,
        p_note: input.note,
        p_tag_names: input.tagNames,
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

    async listActiveTags(ledgerId) {
      const { data, error } = await supabase
        .from("transaction_tag")
        .select("id, name, color")
        .eq("ledger_id", ledgerId)
        .eq("is_archived", false)
        .order("name", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        logger.error("[transaction] failed to load active tags", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_tags_load_failed",
          "交易标签加载失败，请稍后重试。",
        );
      }
      return (data ?? []) as TransactionTagDbRow[];
    },

    async listItems(ledgerId, transactionRecordIds) {
      const uniqueIds = [...new Set(transactionRecordIds)];
      if (uniqueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transaction_item")
        .select(
          "transaction_record_id, account_id, category_id, amount, balance_delta, note",
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
      if (input.recordType === "income" || input.recordType === "expense") {
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

    async listTagAssignments(ledgerId, transactionRecordIds) {
      const uniqueIds = [...new Set(transactionRecordIds)];
      if (uniqueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transaction_record_tag")
        .select("tag_id, transaction_record_id")
        .eq("ledger_id", ledgerId)
        .in("transaction_record_id", uniqueIds)
        .order("sort_order", { ascending: true });
      if (error) {
        logger.error("[transaction] failed to load tag assignments", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_tag_assignments_load_failed",
          "交易标签加载失败，请稍后重试。",
        );
      }
      return (data ?? []) as RawTagAssignment[];
    },

    async listTagsByIds(ledgerId, tagIds) {
      const uniqueIds = [...new Set(tagIds)];
      if (uniqueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("transaction_tag")
        .select("id, name, color")
        .eq("ledger_id", ledgerId)
        .in("id", uniqueIds);
      if (error) {
        logger.error("[transaction] failed to load tags by ids", {
          databaseCode: error.code,
          ledgerId,
        });
        throw toRepositoryError(
          "transaction_tags_load_failed",
          "交易标签加载失败，请稍后重试。",
        );
      }
      return (data ?? []) as TransactionTagDbRow[];
    },

    async loadGroupSummaries(input) {
      const { data, error } = await supabase.rpc(
        "load_transaction_group_summaries",
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
          p_tag_id: input.tagId ?? null,
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
        p_items: input.items,
        p_ledger_id: input.ledgerId,
        p_merchant_id: input.merchantId,
        p_note: input.note,
        p_tag_names: input.tagNames,
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
