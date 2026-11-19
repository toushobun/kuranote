import { transactionAttachmentLimits } from "config/transactionAttachmentLimits";
import { transactionAttachmentMessages } from "config/transactionAttachmentMessages";
import {
  canViewLedger,
  canWriteTransaction,
  requireActiveLedgerMemberRole,
  type LedgerAccessService,
} from "internal/ledger";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "internal/shared/errors/appError";
import { sharedErrorMessages } from "internal/shared/errors/sharedErrorMessages";
import type {
  AttachmentStorageRepository,
  SignedAttachmentRead,
  SignedAttachmentUpload,
} from "internal/transaction/repository/attachmentStorageRepository";
import type { TransactionFormRepository } from "internal/transaction/repository/transactionRepository";

export interface TransactionAttachmentService {
  requestUpload(input: {
    byteSize: number;
    height: number;
    ledgerId: string;
    width: number;
  }): Promise<SignedAttachmentUpload>;
  confirmUpload(input: {
    attachmentId: string;
    ledgerId: string;
  }): Promise<void>;
  deleteDraft(input: { attachmentId: string; ledgerId: string }): Promise<void>;
  getRecordPhotos(input: {
    ledgerId: string;
    transactionRecordId: string;
  }): Promise<SignedAttachmentRead[]>;
}

export function createTransactionAttachmentService({
  attachmentStorageRepository,
  currentUserId,
  ledgerAccessService,
  transactionRepository,
}: {
  attachmentStorageRepository: AttachmentStorageRepository;
  currentUserId: string | null;
  ledgerAccessService: LedgerAccessService;
  transactionRepository: TransactionFormRepository;
}): TransactionAttachmentService {
  async function memberRole(ledgerId: string) {
    if (!currentUserId) {
      throw new AuthenticationError(
        "not_authenticated",
        sharedErrorMessages.authRequired,
      );
    }
    return requireActiveLedgerMemberRole(ledgerAccessService, {
      ledgerId,
      userId: currentUserId,
    });
  }

  async function requireWrite(ledgerId: string) {
    const role = await memberRole(ledgerId);
    if (!canWriteTransaction(role)) {
      throw new AuthorizationError(
        "transaction_attachment_forbidden",
        transactionAttachmentMessages.noPermission,
      );
    }
  }

  return {
    async requestUpload(input) {
      await requireWrite(input.ledgerId);
      if (
        !Number.isSafeInteger(input.byteSize) ||
        input.byteSize < 1 ||
        input.byteSize > transactionAttachmentLimits.maxBytes ||
        !Number.isSafeInteger(input.width) ||
        input.width < 1 ||
        !Number.isSafeInteger(input.height) ||
        input.height < 1
      ) {
        throw new ValidationError(
          "transaction_attachment_invalid",
          transactionAttachmentMessages.invalid,
        );
      }
      return attachmentStorageRepository.requestUpload(input);
    },

    async confirmUpload({ attachmentId, ledgerId }) {
      await requireWrite(ledgerId);
      await attachmentStorageRepository.confirmUpload({
        attachmentId,
        ledgerId,
        userId: currentUserId!,
      });
    },

    async deleteDraft({ attachmentId, ledgerId }) {
      await requireWrite(ledgerId);
      await attachmentStorageRepository.deleteDraft({ attachmentId, ledgerId });
    },

    async getRecordPhotos({ ledgerId, transactionRecordId }) {
      const role = await memberRole(ledgerId);
      if (!canViewLedger(role)) {
        throw new AuthorizationError(
          "transaction_attachment_forbidden",
          transactionAttachmentMessages.noPermission,
        );
      }
      const record = await transactionRepository.findActiveRecord(
        ledgerId,
        transactionRecordId,
      );
      if (!record) {
        throw new NotFoundError(
          "transaction_attachment_record_not_found",
          transactionAttachmentMessages.recordUnavailable,
        );
      }
      const attachments = await attachmentStorageRepository.listByRecord(
        ledgerId,
        transactionRecordId,
      );
      return attachmentStorageRepository.getSignedReadUrls(attachments);
    },
  };
}
