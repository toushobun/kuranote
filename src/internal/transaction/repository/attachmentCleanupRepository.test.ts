import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAttachmentCleanupRepository } from "./attachmentCleanupRepository";

type Row = Record<string, unknown>;

function fixture({
  queuedRows = [] as Row[],
  removeFailed = false,
}: {
  queuedRows?: Row[];
  removeFailed?: boolean;
} = {}) {
  const remove = vi.fn().mockResolvedValue({
    error: removeFailed ? { message: "storage unavailable" } : null,
  });
  const queueDelete = vi.fn().mockResolvedValue({ error: null });
  const selectQuery = {
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: queuedRows, error: null }),
  };
  const deleteQuery = {
    in: queueDelete,
  };
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue(selectQuery),
    delete: vi.fn().mockReturnValue(deleteQuery),
  });
  const supabase = {
    from,
    storage: { from: vi.fn().mockReturnValue({ remove }) },
  } as unknown as SupabaseClient;
  return {
    repo: createAttachmentCleanupRepository(supabase),
    from,
    remove,
    queueDelete,
  };
}

describe("照片文件删除队列", () => {
  it("空队列不访问 Storage", async () => {
    const { repo, remove } = fixture();
    await expect(repo.deleteQueuedFiles()).resolves.toEqual({
      removed: 0,
      failed: 0,
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("Storage 成功后才移除待删队列", async () => {
    const { repo, remove, queueDelete } = fixture({
      queuedRows: [
        {
          id: "row-1",
          storage_path: "ledger/photo.jpg",
          thumbnail_path: "ledger/photo_thumb.jpg",
        },
      ],
    });
    await expect(repo.deleteQueuedFiles()).resolves.toEqual({
      removed: 1,
      failed: 0,
    });
    expect(remove).toHaveBeenCalledWith([
      "ledger/photo.jpg",
      "ledger/photo_thumb.jpg",
    ]);
    expect(queueDelete).toHaveBeenCalledWith("id", ["row-1"]);
  });

  it("Storage 删除失败时保留队列以便下次重试", async () => {
    const { repo, remove, queueDelete } = fixture({
      queuedRows: [
        {
          id: "row-1",
          storage_path: "ledger/photo.jpg",
          thumbnail_path: "ledger/photo_thumb.jpg",
        },
      ],
      removeFailed: true,
    });
    await expect(repo.deleteQueuedFiles()).resolves.toEqual({
      removed: 0,
      failed: 1,
    });
    expect(remove).toHaveBeenCalledOnce();
    expect(queueDelete).not.toHaveBeenCalled();
  });

  it("每批最多一百条队列记录", async () => {
    const rows = Array.from({ length: 235 }, (_, index) => ({
      id: `row-${index}`,
      storage_path: `ledger/${index}.jpg`,
      thumbnail_path: `ledger/${index}_thumb.jpg`,
    }));
    const { repo, remove } = fixture({ queuedRows: rows });
    await expect(repo.deleteQueuedFiles()).resolves.toEqual({
      removed: 235,
      failed: 0,
    });
    expect(remove).toHaveBeenCalledTimes(3);
    expect(remove.mock.calls.map(([paths]) => paths.length)).toEqual([
      200, 200, 70,
    ]);
  });
});
