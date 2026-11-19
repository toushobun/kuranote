import type { AttachmentCleanupRepository } from "internal/transaction/repository/attachmentCleanupRepository";

export type AttachmentCleanupSummary = {
  pendingDeleted: number;
  softDeleted: number;
  storageRemoved: number;
  storageFailed: number;
};

/**
 * 每次 cron 最多处理三个独立的 500 件批次。
 * 独立 try/catch：一个阶段失败不会让其他阶段失去清理机会。
 * 失败的文件始终保留在待删队列，由下一轮重试。
 */
export async function runAttachmentCleanup(
  repository: AttachmentCleanupRepository,
  now: Date = new Date(),
): Promise<AttachmentCleanupSummary> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const summary: AttachmentCleanupSummary = {
    pendingDeleted: 0,
    softDeleted: 0,
    storageRemoved: 0,
    storageFailed: 0,
  };
  try {
    summary.pendingDeleted = await repository.deleteUnclaimedBefore(cutoff);
  } catch (error) {
    console.error("[transaction] pending attachments cleanup failed", {
      errorName: error instanceof Error ? error.message : "unknown",
    });
  }
  try {
    summary.softDeleted = await repository.deleteOnSoftDeletedRecords();
  } catch (error) {
    console.error("[transaction] soft-deleted attachments cleanup failed", {
      errorName: error instanceof Error ? error.message : "unknown",
    });
  }
  try {
    const result = await repository.deleteQueuedFiles();
    summary.storageRemoved = result.removed;
    summary.storageFailed = result.failed;
  } catch (error) {
    console.error("[transaction] storage deletion queue cleanup failed", {
      errorName: error instanceof Error ? error.message : "unknown",
    });
  }
  return summary;
}
