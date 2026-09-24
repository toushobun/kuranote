import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type LedgerInvitePreviewRow = {
  invite_role: string | null;
  invite_status: string | null;
  inviter_name: string | null;
  is_placeholder_bound: boolean | null;
  ledger_name: string | null;
  placeholder_display_name: string | null;
};

export interface LedgerInvitePreviewRepository {
  findByToken(token: string): Promise<LedgerInvitePreviewRow | null>;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// 逐列做运行时类型校验，类型不符的列按 null 处理，不用断言放行未知数据。
function toPreviewRow(value: unknown): LedgerInvitePreviewRow | null {
  if (typeof value !== "object" || value === null) return null;

  const row = value as Record<string, unknown>;
  return {
    invite_role: stringOrNull(row.invite_role),
    invite_status: stringOrNull(row.invite_status),
    inviter_name: stringOrNull(row.inviter_name),
    is_placeholder_bound:
      typeof row.is_placeholder_bound === "boolean"
        ? row.is_placeholder_bound
        : null,
    ledger_name: stringOrNull(row.ledger_name),
    placeholder_display_name: stringOrNull(row.placeholder_display_name),
  };
}

export function createSupabaseLedgerInvitePreviewRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): LedgerInvitePreviewRepository {
  return {
    async findByToken(token) {
      const { data, error } = await supabase.rpc("get_ledger_invite_preview", {
        p_token: token,
      });
      const row = Array.isArray(data) ? data[0] : null;

      if (error) {
        logger.error("[ledgerInvite] failed to load invite preview", {
          databaseCode: error.code,
        });
        throw toRepositoryError(
          "ledger_invite_preview_load_failed",
          "邀请信息加载失败，请稍后重试。",
        );
      }

      return toPreviewRow(row);
    },
  };
}
