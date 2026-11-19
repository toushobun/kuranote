import "server-only";

import { createAttachmentCleanupRepository } from "internal/transaction/repository/attachmentCleanupRepository";
import { runAttachmentCleanup } from "internal/transaction/service/attachmentCleanupService";

/** 定时任务的模块级入口：隔离 adapter 与仓储、服务实现。 */
export function executeAttachmentCleanup() {
  return runAttachmentCleanup(createAttachmentCleanupRepository());
}
