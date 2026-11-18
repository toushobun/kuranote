import { describe, expect, it, vi } from "vitest";
import type { AttachmentCleanupRepository } from "internal/transaction/repository/attachmentCleanupRepository";
import { runAttachmentCleanup } from "./attachmentCleanupService";

function repository(): AttachmentCleanupRepository {
  return {
    deleteUnclaimedBefore: vi.fn().mockResolvedValue(2),
    deleteOnSoftDeletedRecords: vi.fn().mockResolvedValue(3),
    deleteQueuedFiles: vi.fn().mockResolvedValue({ removed: 4, failed: 1 }),
  };
}

describe("runAttachmentCleanup", () => {
  it("只清理已超过 24 小时的草稿并依次执行软删和队列阶段", async () => {
    const repo = repository();
    const summary = await runAttachmentCleanup(
      repo,
      new Date("2026-11-18T10:00:00.000Z"),
    );
    expect(repo.deleteUnclaimedBefore).toHaveBeenCalledWith(
      "2026-11-17T10:00:00.000Z",
    );
    expect(repo.deleteOnSoftDeletedRecords).toHaveBeenCalledOnce();
    expect(repo.deleteQueuedFiles).toHaveBeenCalledOnce();
    expect(summary).toEqual({
      pendingDeleted: 2,
      softDeleted: 3,
      storageRemoved: 4,
      storageFailed: 1,
    });
  });

  it("草稿删除失败时仍尝试删除软删照片和队列", async () => {
    const repo = repository();
    vi.mocked(repo.deleteUnclaimedBefore).mockRejectedValueOnce(new Error("database error"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await runAttachmentCleanup(repo);
      expect(result.pendingDeleted).toBe(0);
      expect(result.softDeleted).toBe(3);
      expect(repo.deleteQueuedFiles).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});
