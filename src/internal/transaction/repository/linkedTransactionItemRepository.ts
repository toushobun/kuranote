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
import {
  transactionAccessErrorMessages,
  transactionErrorCodes,
  transactionLinkedEditErrorMessages,
  transactionLoadErrorMessages,
  transactionValidationErrorMessages,
  transactionWriteErrorMessages,
} from "internal/transaction/errors";
import { findRpcErrorCode } from "internal/transaction/repository/rpcError";
import type { TransactionPayment } from "internal/transaction/entity/transactionPayment";
import { toTransactionPaymentRpcPayload } from "internal/transaction/util/transactionPaymentRpcPayload";

export type LinkedTransactionItemEditSnapshot = {
  amount: string;
  categoryId: string;
  transactionItemId: string;
  transactionRecordId: string;
  updatedAt: string;
};

export type UpdateLinkedTransactionEditInput = {
  expectedRecordUpdatedAt?: string;
  itemUpdates: Array<{
    amount: number;
    categoryId: string;
    expectedUpdatedAt: string;
    transactionItemId: string;
  }>;
  ledgerId: string;
  merchantId: string;
  note: string | null;
  payments: TransactionPayment[];
  transactionAt: string;
  transactionRecordId: string;
};

export interface LinkedTransactionItemRepository {
  findEditSnapshot(
    ledgerId: string,
    transactionItemId: string,
  ): Promise<LinkedTransactionItemEditSnapshot | null>;
  updateEdit(input: UpdateLinkedTransactionEditInput): Promise<void>;
}

type LinkedTransactionItemRow = {
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
  "permission_denied",
  "transaction_not_found",
  "transaction_item_version_conflict",
  "transaction_at_invalid",
  "linked_edit_items_invalid",
  transactionErrorCodes.accountInvalid,
  transactionErrorCodes.amountInvalid,
  transactionErrorCodes.categoryInvalid,
  transactionErrorCodes.merchantInvalid,
  transactionErrorCodes.noteTooLong,
  transactionErrorCodes.specialStatusInvalid,
  transactionErrorCodes.incomeLinkCategoryInvalid,
  "refund_currency_mismatch",
  "reimbursement_currency_mismatch",
  "linked_transaction_edit_forbidden",
  transactionErrorCodes.paymentAccountDuplicate,
  transactionErrorCodes.paymentAmountRequired,
  transactionErrorCodes.paymentCurrencyMismatch,
  transactionErrorCodes.paymentMultiAccountNotAllowed,
  transactionErrorCodes.paymentTotalMismatch,
  transactionErrorCodes.paymentTransitionInvalid,
] as const;

type LinkedEditLogContext = {
  ledgerId: string;
  transactionItemId?: string;
  transactionRecordId: string;
};

export function createSupabaseLinkedTransactionItemRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): LinkedTransactionItemRepository {
  function throwRpcError(
    error: RpcError,
    context: LinkedEditLogContext,
  ): never {
    const rpcErrorCode = findRpcErrorCode(
      error.details,
      linkedEditRpcErrorCodes,
    );
    logger.error("[transaction] failed to update linked transaction item", {
      databaseCode: error.code,
      databaseDetails: error.details,
      databaseMessage: error.message,
      ledgerId: context.ledgerId,
      transactionItemId: context.transactionItemId,
      transactionRecordId: context.transactionRecordId,
    });

    if (rpcErrorCode === "not_authenticated" || error.code === "28000") {
      throw new AuthenticationError(
        "auth_required",
        transactionAccessErrorMessages.authRequired,
      );
    }
    if (
      rpcErrorCode === "ledger_forbidden" ||
      rpcErrorCode === "permission_denied" ||
      error.code === "42501"
    ) {
      throw new AuthorizationError(
        transactionErrorCodes.permissionDenied,
        transactionAccessErrorMessages.permissionDenied,
      );
    }
    if (rpcErrorCode === "transaction_not_found") {
      throw new NotFoundError(
        transactionErrorCodes.updateInvalid,
        transactionAccessErrorMessages.itemNotFound,
      );
    }
    if (rpcErrorCode === "transaction_item_version_conflict") {
      throw new ConflictError(
        transactionErrorCodes.updateInvalid,
        transactionLinkedEditErrorMessages.itemVersionConflict,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.accountInvalid) {
      throw new ValidationError(
        transactionErrorCodes.accountInvalid,
        transactionWriteErrorMessages.accountInvalid,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.amountInvalid) {
      throw new ValidationError(
        transactionErrorCodes.amountInvalid,
        transactionWriteErrorMessages.amountInvalid,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.categoryInvalid) {
      throw new ValidationError(
        transactionErrorCodes.categoryInvalid,
        transactionWriteErrorMessages.categoryInvalid,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.merchantInvalid) {
      throw new ValidationError(
        transactionErrorCodes.merchantInvalid,
        transactionWriteErrorMessages.merchantInvalid,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.noteTooLong) {
      throw new ValidationError(
        transactionErrorCodes.noteTooLong,
        transactionValidationErrorMessages[transactionErrorCodes.noteTooLong],
      );
    }
    if (
      rpcErrorCode === transactionErrorCodes.specialStatusInvalid ||
      rpcErrorCode === transactionErrorCodes.incomeLinkCategoryInvalid
    ) {
      throw new ValidationError(
        transactionErrorCodes.specialStatusInvalid,
        transactionLinkedEditErrorMessages.linkBroken,
      );
    }
    if (rpcErrorCode === "refund_currency_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        transactionLinkedEditErrorMessages.refundCurrencyMismatch,
      );
    }
    if (rpcErrorCode === "reimbursement_currency_mismatch") {
      throw new ValidationError(
        transactionErrorCodes.reimbursementLinkInvalid,
        transactionLinkedEditErrorMessages.reimbursementCurrencyMismatch,
      );
    }
    if (rpcErrorCode === "linked_transaction_edit_forbidden") {
      throw new ConflictError(
        transactionErrorCodes.updateInvalid,
        transactionLinkedEditErrorMessages.itemNotEditable,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.paymentAccountDuplicate) {
      throw new ValidationError(
        rpcErrorCode,
        transactionWriteErrorMessages.paymentAccountDuplicate,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.paymentTotalMismatch) {
      throw new ValidationError(
        rpcErrorCode,
        transactionWriteErrorMessages.paymentTotalMismatch,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.paymentMultiAccountNotAllowed) {
      throw new ValidationError(
        rpcErrorCode,
        transactionWriteErrorMessages.paymentMultiAccountNotAllowed,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.paymentCurrencyMismatch) {
      throw new ValidationError(
        rpcErrorCode,
        transactionWriteErrorMessages.paymentCurrencyMismatch,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.paymentAmountRequired) {
      throw new ValidationError(
        rpcErrorCode,
        transactionWriteErrorMessages.paymentAmountRequired,
      );
    }
    if (rpcErrorCode === transactionErrorCodes.paymentTransitionInvalid) {
      throw new ValidationError(
        rpcErrorCode,
        transactionWriteErrorMessages.paymentTransitionInvalid,
      );
    }
    if (
      rpcErrorCode === "transaction_at_invalid" ||
      rpcErrorCode === "linked_edit_items_invalid" ||
      error.code === "22023"
    ) {
      throw new ValidationError(
        transactionErrorCodes.updateInvalid,
        transactionWriteErrorMessages.inputInvalid,
      );
    }
    throw toRepositoryError(
      transactionErrorCodes.updateFailed,
      transactionAccessErrorMessages.operationFailed,
    );
  }

  return {
    async findEditSnapshot(ledgerId, transactionItemId) {
      const { data, error } = await supabase
        .from("transaction_item")
        .select("id, transaction_record_id, category_id, amount, updated_at")
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
          transactionLoadErrorMessages.linkedItemLoadFailed,
        );
      }
      if (!data) return null;
      const row = data as LinkedTransactionItemRow;
      if (!row.category_id) return null;
      return {
        amount: String(row.amount),
        categoryId: row.category_id,
        transactionItemId: row.id,
        transactionRecordId: row.transaction_record_id,
        updatedAt: row.updated_at,
      };
    },

    async updateEdit(input) {
      const { error } = await supabase.rpc("update_linked_transaction_edit", {
        p_expected_record_updated_at: input.expectedRecordUpdatedAt ?? null,
        p_item_updates: input.itemUpdates,
        p_ledger_id: input.ledgerId,
        p_merchant_id: input.merchantId,
        p_note: input.note,
        p_payments: toTransactionPaymentRpcPayload(input.payments),
        p_transaction_at: input.transactionAt,
        p_transaction_record_id: input.transactionRecordId,
      });
      if (error) {
        throwRpcError(error, {
          ledgerId: input.ledgerId,
          transactionRecordId: input.transactionRecordId,
        });
      }
    },
  };
}
