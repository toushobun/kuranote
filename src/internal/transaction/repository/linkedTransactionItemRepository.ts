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
import { transactionErrorCodes } from "internal/transaction/errors";
import { findRpcErrorCode } from "internal/transaction/repository/rpcError";

export type LinkedTransactionItemEditSnapshot = {
  accountId: string;
  amount: string;
  categoryId: string;
  transactionItemId: string;
  transactionRecordId: string;
  updatedAt: string;
};

export type UpdateLinkedTransactionItemInput = {
  accountId: string;
  amount: number;
  categoryId: string;
  expectedUpdatedAt: string;
  ledgerId: string;
  transactionItemId: string;
  transactionRecordId: string;
};

export interface LinkedTransactionItemRepository {
  findEditSnapshot(
    ledgerId: string,
    transactionItemId: string,
  ): Promise<LinkedTransactionItemEditSnapshot | null>;
  update(input: UpdateLinkedTransactionItemInput): Promise<void>;
}

type LinkedTransactionItemRow = {
  account_id: string;
  amount: number | string;
  category_id: string | null;
  id: string;
  transaction_record_id: string;
  updated_at: string;
};

type RpcError = {
  code?: string | null;
  details?: string | null;
  message?: string | null;
};

const linkedEditRpcErrorCodes = [
  "not_authenticated",
  "ledger_forbidden",
  "transaction_not_found",
  "transaction_item_version_conflict",
  transactionErrorCodes.accountInvalid,
  transactionErrorCodes.amountInvalid,
  transactionErrorCodes.categoryInvalid,
  transactionErrorCodes.specialStatusInvalid,
  transactionErrorCodes.incomeLinkCategoryInvalid,
  "refund_account_mismatch",
  "reimbursement_currency_mismatch",
  "linked_transaction_edit_forbidden",
] as const;

export function createSupabaseLinkedTransactionItemRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): LinkedTransactionItemRepository {
  function throwRpcError(
    error: RpcError,
    input: UpdateLinkedTransactionItemInput,
  ): never {
    const rpcErrorCode = findRpcErrorCode(error.details, linkedEditRpcErrorCodes);
    logger.error("[transaction] failed to update linked transaction item", {
      databaseCode: error.code,
      databaseDetails: error.details,
      databaseMessage: error.message,
      ledgerId: input.ledgerId,
      transactionItemId: input.transactionItemId,
      transactionRecordId: input.transactionRecordId,
    });

    if (rpcErrorCode === "not_authenticated" || error.code === "28000") {
      throw new AuthenticationError("auth_required", "请先登录。");
    }
    if (rpcErrorCode === "ledger_forbidden" || error.code === "42501") {
      throw new AuthorizationError(
        transactionErrorCodes.permissionDenied,
        "没有权限执行此交易操作。",
      );
    }
    if (rpcErrorCode === "transaction_not_found") {
      throw new NotFoundError(
        transactionErrorCodes.updateInvalid,
        "交易明细不存在或已删除。",
      );
    }
    if (rpcErrorCode === "transaction_item_version_conflict") {
      throw new ConflictError(
        transactionErrorCodes.updateInvalid,
        "交易明细已被其他操作更新，请刷新后重试。",
      );
    }
    if (rpcErrorCode === transactionErrorCodes.accountInvalid) {
      throw new ValidationError(
        transactionErrorCodes.accountInvalid,
        "账户信息不正确，请确认后重试。",
      );
    }
    if (rpcErrorCode === transactionErrorCodes.amountInvalid) {
      throw new ValidationError(
        transactionErrorCodes.amountInvalid,
        "金额格式不正确，请确认后重试。",
      );
    }
    if (rpcErrorCode === transactionErrorCodes.categoryInvalid) {
      throw new ValidationError(
        transactionErrorCodes.categoryInvalid,
        "分类信息不正确，请确认后重试。",
      );
    }
    if (
      rpcErrorCode === transactionErrorCodes.specialStatusInvalid ||
      rpcErrorCode === transactionErrorCodes.incomeLinkCategoryInvalid
    ) {
      throw new ValidationError(
        transactionErrorCodes.specialStatusInvalid,
        "分类或收支类型会破坏现有退款 / 报销关联。",
      );
    }
    if (rpcErrorCode === "refund_account_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        "退款关联要求收入与目标支出使用同一账户和币种。",
      );
    }
    if (rpcErrorCode === "reimbursement_currency_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.reimbursementLinkInvalid,
        "报销收入与目标支出的账户币种必须一致。",
      );
    }
    if (rpcErrorCode === "linked_transaction_edit_forbidden") {
      throw new ConflictError(
        transactionErrorCodes.updateInvalid,
        "该明细当前不属于可受控编辑的退款 / 报销关联。",
      );
    }
    if (error.code === "22023") {
      throw new ValidationError(
        transactionErrorCodes.updateInvalid,
        "交易内容不正确，请确认后重试。",
      );
    }
    throw toRepositoryError(
      transactionErrorCodes.updateFailed,
      "交易操作失败，请稍后重试。",
    );
  }

  return {
    async findEditSnapshot(ledgerId, transactionItemId) {
      const { data, error } = await supabase
        .from("transaction_item")
        .select(
          "id, transaction_record_id, account_id, category_id, amount, updated_at",
        )
        .eq("ledger_id", ledgerId)
        .eq("id", transactionItemId)
        .maybeSingle();
      if (error) {
        logger.error("[transaction] failed to load linked item edit snapshot", {
          databaseCode: error.code,
          ledgerId,
          transactionItemId,
        });
        throw toRepositoryError(
          "linked_transaction_item_load_failed",
          "交易明细读取失败，请稍后重试。",
        );
      }
      if (!data) return null;
      const row = data as LinkedTransactionItemRow;
      if (!row.category_id) return null;
      return {
        accountId: row.account_id,
        amount: String(row.amount),
        categoryId: row.category_id,
        transactionItemId: row.id,
        transactionRecordId: row.transaction_record_id,
        updatedAt: row.updated_at,
      };
    },

    async update(input) {
      const { error } = await supabase.rpc("update_linked_transaction_item", {
        p_account_id: input.accountId,
        p_amount: input.amount,
        p_category_id: input.categoryId,
        p_expected_updated_at: input.expectedUpdatedAt,
        p_ledger_id: input.ledgerId,
        p_transaction_item_id: input.transactionItemId,
        p_transaction_record_id: input.transactionRecordId,
      });
      if (error) throwRpcError(error, input);
    },
  };
}
