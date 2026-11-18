import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { handleAttachmentCleanupRequest } from "./attachmentCleanupRoute";

describe("照片清理 Cron 鉴权", () => {
  it("未设置 CRON_SECRET 拒绝执行且不会初始化清理仓储", async () => {
    const cleanup = vi.fn();
    const response = await handleAttachmentCleanupRequest(
      new Request("http://localhost/api/cron/attachment-cleanup"),
      { secret: "", cleanup },
    );
    expect(response.status).toBe(503);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("缺少认证头拒绝", async () => {
    const cleanup = vi.fn();
    const response = await handleAttachmentCleanupRequest(
      new Request("http://localhost/api/cron/attachment-cleanup"),
      { secret: "test-secret", cleanup },
    );
    expect(response.status).toBe(401);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("错误密钥拒绝，即使前缀正确也不执行", async () => {
    const cleanup = vi.fn();
    const response = await handleAttachmentCleanupRequest(
      new Request("http://localhost/api/cron/attachment-cleanup", {
        headers: { Authorization: "Bearer incorrect" },
      }),
      { secret: "test-secret", cleanup },
    );
    expect(response.status).toBe(401);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("有效 Bearer 密钥允许执行并返回计数", async () => {
    const cleanup = vi.fn().mockResolvedValue({
      pendingDeleted: 2,
      softDeleted: 3,
      storageRemoved: 4,
      storageFailed: 0,
    });
    const response = await handleAttachmentCleanupRequest(
      new Request("http://localhost/api/cron/attachment-cleanup", {
        headers: { Authorization: "Bearer test-secret" },
      }),
      { secret: "test-secret", cleanup },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      pendingDeleted: 2,
      softDeleted: 3,
      storageRemoved: 4,
      storageFailed: 0,
    });
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
