import { createClient } from "lib/supabase/server";
import {
  invalidLedgerInvitePreview,
  type LedgerInvitePreview,
} from "server/ledger/entity/ledgerInvitePreview";
import { createSupabaseLedgerInvitePreviewRepository } from "server/ledger/repository/ledgerInvitePreviewRepository";
import { createLedgerInvitePreviewService } from "server/ledger/service/ledgerInvitePreviewService";
import { createLogger } from "server/shared/logging/logger";

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
