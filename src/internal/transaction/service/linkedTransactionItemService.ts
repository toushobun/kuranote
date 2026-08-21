import { canModifyTransaction, canWriteTransaction } from "internal/ledger";
import {
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "internal/shared/errors/appError";
import { transactionErrorCodes } from "internal/transaction/errors";
import type { TransactionCommandRepository } from "internal/transaction/repository/transactionRepository";
import type {
  LinkedTransactionItemEditSnapshot,
  LinkedTransactionItemRepository,
  UpdateLinkedTransactionItemInput,
  UpdateLinkedTransactionRecordMetadataInput,
} from "internal/transaction/repository/linkedTransactionItemRepository";

export type LinkedTransactionItemServiceDependencies = {
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  linkedTransactionItemRepository: LinkedTransactionItemRepository;
  transactionRepository: Pick<TransactionCommandRepository, "findActiveRecord">;
};

export type UpdateLinkedTransactionRecordMetadataServiceInput = Omit<
  UpdateLinkedTransactionRecordMetadataInput,
  "updatedBy"
>;

export interface LinkedTransactionItemService {
  getEditSnapshot(input: {
    ledgerId: string;
    transactionItemId: string;
    transactionRecordId: string;
  }): Promise<LinkedTransactionItemEditSnapshot>;
  update(input: UpdateLinkedTransactionItemInput): Promise<void>;
  updateRecordMetadata(
    input: UpdateLinkedTransactionRecordMetadataServiceInput,
  ): Promise<void>;
}

function permissionError() {
  return new AuthorizationError(
    transactionErrorCodes.permissionDenied,
    "没有权限执行此交易操作。",
  );
}

export function createLinkedTransactionItemService({
  currentUserId,
  ledgerAccessService,
  linkedTransactionItemRepository,
  transactionRepository,
}: LinkedTransactionItemServiceDependencies): LinkedTransactionItemService {
  async function requireModificationPermission(
    ledgerId: string,
    transactionRecordId: string,
  ) {
    if (!currentUserId) {
      throw new AuthenticationError("auth_required", "请先登录。");
    }
    const role = await requireActiveLedgerMemberRole(ledgerAccessService, {
      ledgerId,
      userId: currentUserId,
    });
    if (!canWriteTransaction(role)) throw permissionError();

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
        userId: currentUserId,
      })
    ) {
      throw permissionError();
    }
  }

  return {
    async getEditSnapshot(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      const snapshot = await linkedTransactionItemRepository.findEditSnapshot(
        input.ledgerId,
        input.transactionItemId,
      );
      if (
        !snapshot ||
        snapshot.transactionRecordId !== input.transactionRecordId
      ) {
        throw new NotFoundError(
          transactionErrorCodes.updateInvalid,
          "交易明细不存在或已删除。",
        );
      }
      return snapshot;
    },

    async update(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      await linkedTransactionItemRepository.update(input);
    },

    async updateRecordMetadata(input) {
      await requireModificationPermission(
        input.ledgerId,
        input.transactionRecordId,
      );
      if (!currentUserId) {
        throw new AuthenticationError("auth_required", "请先登录。");
      }
      await linkedTransactionItemRepository.updateRecordMetadata({
        ...input,
        updatedBy: currentUserId,
      });
    },
  };
}
