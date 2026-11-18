import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "internal/shared/supabase/serviceRoleClient";

const bucketName = "transaction-attachments";
const maxPerStep = 500;
const deleteBatchSize = 100;

export interface AttachmentCleanupRepository {
  deleteUnclaimedBefore(cutoff: string): Promise<number>;
  deleteOnSoftDeletedRecords(): Promise<number>;
  deleteQueuedFiles(): Promise<{ removed: number; failed: number }>;
}

/**
 * 后台清理唯一持有 service_role 的存储仓储。
 * 数据行删除经过数据库触发器进入待删队列，Storage 对象只能由 API 清理。
 */
export function createAttachmentCleanupRepository(
  supabase: SupabaseClient = createServiceRoleSupabaseClient(),
): AttachmentCleanupRepository {
  return {
    async deleteUnclaimedBefore(cutoff) {
      const { data, error } = await supabase
        .from("transaction_attachment")
        .select("id")
        .is("transaction_record_id", null)
        .lt("created_at", cutoff)
        .order("created_at", { ascending: true })
        .limit(maxPerStep);
      if (error) throw new Error("attachment_cleanup_pending_query_failed");
      const ids = (data ?? []).map((row) => row.id);
      if (!ids.length) return 0;
      const { error: deleteError } = await supabase
        .from("transaction_attachment")
        .delete()
        .in("id", ids);
      if (deleteError) throw new Error("attachment_cleanup_pending_delete_failed");
      return ids.length;
    },

    async deleteOnSoftDeletedRecords() {
      // 用 inner join 直接筛选含附件且状态已删除的记录，
      // 不会因为数据库里存在大量已清理的软删除交易而饿死新任务。
      const { data, error } = await supabase
        .from("transaction_attachment")
        .select("id, transaction_record!inner(status)")
        .eq("transaction_record.status", "deleted")
        .order("created_at", { ascending: true })
        .limit(maxPerStep);
      if (error) throw new Error("attachment_cleanup_deleted_query_failed");
      const ids = (data ?? []).map((row) => row.id);
      if (!ids.length) return 0;
      const { error: deleteError } = await supabase
        .from("transaction_attachment")
        .delete()
        .in("id", ids);
      if (deleteError) throw new Error("attachment_cleanup_deleted_delete_failed");
      return ids.length;
    },

    async deleteQueuedFiles() {
      const { data, error } = await supabase
        .from("transaction_attachment_storage_deletion")
        .select("id,storage_path,thumbnail_path")
        .order("created_at", { ascending: true })
        .limit(maxPerStep);
      if (error) throw new Error("attachment_cleanup_queue_query_failed");

      let removed = 0;
      let failed = 0;
      const rows = data ?? [];
      for (let index = 0; index < rows.length; index += deleteBatchSize) {
        const batch = rows.slice(index, index + deleteBatchSize);
        const paths = batch.flatMap((entry) => [
          entry.storage_path,
          entry.thumbnail_path,
        ]);
        // 只有 Storage API 明确成功，才从待删队列移除记录；
        // 失败留在队列下次重试。部分已删除对象的重试应是幂等的。
        try {
          const result = await supabase.storage.from(bucketName).remove(paths);
          if (result.error) {
            failed += batch.length;
            continue;
          }
          const { error: queueError } = await supabase
            .from("transaction_attachment_storage_deletion")
            .delete()
            .in("id", batch.map((entry) => entry.id));
          if (queueError) {
            failed += batch.length;
            continue;
          }
          removed += batch.length;
        } catch {
          failed += batch.length;
        }
      }
      return { removed, failed };
    },
  };
}
