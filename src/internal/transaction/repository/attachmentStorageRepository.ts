import { z } from "zod";
import { transactionAttachmentMessages } from "config/transactionAttachmentMessages";
import {
  AuthorizationError,
  ValidationError,
} from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";
import { createServiceRoleSupabaseClient } from "internal/shared/supabase/serviceRoleClient";

const attachmentBucket = "transaction-attachments";
const signedReadLifetimeSeconds = 3600;

const attachmentRowSchema = z.object({
  id: z.string().uuid(),
  ledger_id: z.string().uuid(),
  transaction_record_id: z.string().uuid().nullable(),
  status: z.enum(["pending", "uploaded"]),
  storage_path: z.string(),
  thumbnail_path: z.string(),
  created_by: z.string().uuid(),
  sort_order: z.number(),
});

export type TransactionAttachment = z.infer<typeof attachmentRowSchema>;

export type SignedAttachmentUpload = {
  attachmentId: string;
  full: { path: string; signedUrl: string; token: string };
  thumbnail: { path: string; signedUrl: string; token: string };
};

export type SignedAttachmentRead = {
  id: string;
  fullUrl: string;
  thumbnailUrl: string;
};

export interface AttachmentStorageRepository {
  requestUpload(input: {
    byteSize: number;
    height: number;
    ledgerId: string;
    width: number;
  }): Promise<SignedAttachmentUpload>;
  confirmUpload(input: {
    attachmentId: string;
    ledgerId: string;
    userId: string;
  }): Promise<void>;
  deleteDraft(input: { attachmentId: string; ledgerId: string }): Promise<void>;
  listByRecord(
    ledgerId: string,
    recordId: string,
  ): Promise<TransactionAttachment[]>;
  listByRecords(
    ledgerId: string,
    recordIds: readonly string[],
  ): Promise<TransactionAttachment[]>;
  getSignedReadUrls(
    attachments: readonly TransactionAttachment[],
    lifetimeSeconds?: number,
  ): Promise<SignedAttachmentRead[]>;
}

export function createSupabaseAttachmentStorageRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): AttachmentStorageRepository {
  // 只有服务端持有此 Client。浏览器只能使用已签发的短期 URL 上传。
  const bucket = () =>
    createServiceRoleSupabaseClient().storage.from(attachmentBucket);

  function repositoryError(operation: string, message: string) {
    logger.error("[transaction] attachment storage operation failed", {
      operation,
    });
    return toRepositoryError("transaction_attachment_storage_failed", message);
  }

  function rpcError(
    operation: string,
    error: { details?: string | null; message?: string | null },
    message: string,
  ) {
    if (error.details === "ledger_forbidden") {
      return new AuthorizationError(
        "transaction_attachment_forbidden",
        transactionAttachmentMessages.noPermission,
      );
    }
    if (error.details === "attachment_invalid") {
      return new ValidationError(
        "transaction_attachment_invalid",
        transactionAttachmentMessages.invalid,
      );
    }
    logger.error("[transaction] attachment RPC failed", {
      operation,
      errorName: "PostgrestError",
    });
    return toRepositoryError("transaction_attachment_rpc_failed", message);
  }

  async function getOwnedDraft(
    ledgerId: string,
    attachmentId: string,
    userId: string,
  ): Promise<TransactionAttachment> {
    const { data, error } = await supabase
      .from("transaction_attachment")
      .select(
        "id,ledger_id,transaction_record_id,status,storage_path,thumbnail_path,created_by,sort_order",
      )
      .eq("ledger_id", ledgerId)
      .eq("id", attachmentId)
      .eq("created_by", userId)
      .is("transaction_record_id", null)
      .maybeSingle();

    if (error)
      throw rpcError(
        "getDraft",
        error,
        transactionAttachmentMessages.loadFailed,
      );
    const parsed = attachmentRowSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError(
        "transaction_attachment_invalid",
        transactionAttachmentMessages.invalid,
      );
    }
    return parsed.data;
  }

  return {
    async requestUpload({ byteSize, height, ledgerId, width }) {
      const { data, error } = await supabase.rpc(
        "request_transaction_attachment_upload",
        {
          p_byte_size: byteSize,
          p_height: height,
          p_ledger_id: ledgerId,
          p_width: width,
        },
      );
      if (error) {
        throw rpcError(
          "requestUpload",
          error,
          transactionAttachmentMessages.uploadFailed,
        );
      }
      if (typeof data !== "string") {
        throw repositoryError(
          "requestUpload",
          transactionAttachmentMessages.uploadFailed,
        );
      }
      const fullPath = `${ledgerId}/${data}.jpg`;
      const thumbPath = `${ledgerId}/${data}_thumb.jpg`;
      const [fullResult, thumbResult] = await Promise.all([
        bucket().createSignedUploadUrl(fullPath),
        bucket().createSignedUploadUrl(thumbPath),
      ]);
      if (
        fullResult.error ||
        thumbResult.error ||
        !fullResult.data?.signedUrl ||
        !thumbResult.data?.signedUrl ||
        !fullResult.data.token ||
        !thumbResult.data.token
      ) {
        throw repositoryError(
          "createUploadUrl",
          transactionAttachmentMessages.uploadFailed,
        );
      }
      return {
        attachmentId: data,
        full: {
          path: fullPath,
          signedUrl: fullResult.data.signedUrl,
          token: fullResult.data.token,
        },
        thumbnail: {
          path: thumbPath,
          signedUrl: thumbResult.data.signedUrl,
          token: thumbResult.data.token,
        },
      };
    },

    async confirmUpload({ attachmentId, ledgerId, userId }) {
      const attachment = await getOwnedDraft(ledgerId, attachmentId, userId);
      if (attachment.status !== "pending") {
        throw new ValidationError(
          "transaction_attachment_invalid",
          transactionAttachmentMessages.invalid,
        );
      }
      const [fullResult, thumbResult] = await Promise.all([
        bucket().info(attachment.storage_path),
        bucket().info(attachment.thumbnail_path),
      ]);
      if (
        fullResult.error ||
        thumbResult.error ||
        !fullResult.data ||
        !thumbResult.data
      ) {
        throw new ValidationError(
          "transaction_attachment_upload_incomplete",
          transactionAttachmentMessages.confirmFailed,
        );
      }
      const { error } = await supabase.rpc(
        "confirm_transaction_attachment_upload",
        { p_attachment_id: attachmentId, p_ledger_id: ledgerId },
      );
      if (error) {
        throw rpcError(
          "confirmUpload",
          error,
          transactionAttachmentMessages.uploadFailed,
        );
      }
    },

    async deleteDraft({ attachmentId, ledgerId }) {
      const { error } = await supabase.rpc(
        "delete_transaction_attachment_draft",
        {
          p_attachment_id: attachmentId,
          p_ledger_id: ledgerId,
        },
      );
      if (error) {
        throw rpcError(
          "deleteDraft",
          error,
          transactionAttachmentMessages.deleteFailed,
        );
      }
    },

    async listByRecord(ledgerId, recordId) {
      const { data, error } = await supabase
        .from("transaction_attachment")
        .select(
          "id,ledger_id,transaction_record_id,status,storage_path,thumbnail_path,created_by,sort_order",
        )
        .eq("ledger_id", ledgerId)
        .eq("transaction_record_id", recordId)
        .eq("status", "uploaded")
        .order("sort_order", { ascending: true });
      if (error) {
        throw rpcError(
          "listByRecord",
          error,
          transactionAttachmentMessages.loadFailed,
        );
      }
      const parsed = attachmentRowSchema.array().safeParse(data);
      if (!parsed.success) {
        throw repositoryError(
          "listByRecord",
          transactionAttachmentMessages.loadFailed,
        );
      }
      return parsed.data;
    },

    async listByRecords(ledgerId, recordIds) {
      const result: TransactionAttachment[] = [];
      const uniqueIds = [...new Set(recordIds)];
      for (let offset = 0; offset < uniqueIds.length; offset += 100) {
        const { data, error } = await supabase
          .from("transaction_attachment")
          .select(
            "id,ledger_id,transaction_record_id,status,storage_path,thumbnail_path,created_by,sort_order",
          )
          .eq("ledger_id", ledgerId)
          .eq("status", "uploaded")
          .in("transaction_record_id", uniqueIds.slice(offset, offset + 100))
          .order("transaction_record_id")
          .order("sort_order");
        if (error) {
          throw rpcError(
            "listByRecords",
            error,
            transactionAttachmentMessages.loadFailed,
          );
        }
        const parsed = attachmentRowSchema.array().safeParse(data);
        if (!parsed.success) {
          throw repositoryError(
            "listByRecords",
            transactionAttachmentMessages.loadFailed,
          );
        }
        result.push(...parsed.data);
      }
      return result;
    },

    async getSignedReadUrls(
      attachments,
      lifetimeSeconds = signedReadLifetimeSeconds,
    ) {
      if (attachments.length === 0) return [];
      const paths = attachments.flatMap((attachment) => [
        attachment.storage_path,
        attachment.thumbnail_path,
      ]);
      const { data, error } = await bucket().createSignedUrls(
        paths,
        lifetimeSeconds,
      );
      if (error || !data || data.length !== paths.length) {
        throw repositoryError(
          "createSignedUrls",
          transactionAttachmentMessages.loadFailed,
        );
      }
      const urls = data.map((item, index) =>
        item.path === paths[index] && !item.error ? item.signedUrl : undefined,
      );
      if (urls.some((url) => !url)) {
        throw repositoryError(
          "createSignedUrls",
          transactionAttachmentMessages.loadFailed,
        );
      }
      return attachments.map((attachment, index) => ({
        id: attachment.id,
        fullUrl: urls[index * 2]!,
        thumbnailUrl: urls[index * 2 + 1]!,
      }));
    },
  };
}
