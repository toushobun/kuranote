import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type LedgerInvitePreviewRow = {
  invite_role: string | null;
  invite_status: string | null;
  inviter_name: string | null;
  ledger_name: string | null;
};

export interface LedgerInvitePreviewRepository {
  findByToken(token: string): Promise<LedgerInvitePreviewRow | null>;
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

      return row ? (row as LedgerInvitePreviewRow) : null;
    },
  };
}
