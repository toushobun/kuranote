import { createClient } from "lib/supabase/server";
import {
  invalidLedgerInvitePreview,
  type LedgerInvitePreview,
} from "internal/ledger/entity/ledgerInvitePreview";
import { createSupabaseLedgerInvitePreviewRepository } from "internal/ledger/repository/ledgerInvitePreviewRepository";
import { createLedgerInvitePreviewService } from "internal/ledger/service/ledgerInvitePreviewService";
import { createLogger } from "internal/shared/logging/logger";

export type { LedgerInvitePreview } from "internal/ledger/entity/ledgerInvitePreview";

export async function loadLedgerInvitePreview(
  token: string,
): Promise<LedgerInvitePreview> {
  const logger = createLogger("ledger-invite-preview");

  try {
    const supabase = await createClient();
    const repository = createSupabaseLedgerInvitePreviewRepository(
      supabase,
      logger,
    );

    return await createLedgerInvitePreviewService(repository).load(token);
  } catch (error) {
    logger.error("[ledgerInvite] failed to load invite preview", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return invalidLedgerInvitePreview;
  }
}
