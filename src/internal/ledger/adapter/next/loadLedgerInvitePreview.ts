import { createRequestContainer } from "internal/container";
import {
  invalidLedgerInvitePreview,
  type LedgerInvitePreview,
} from "internal/ledger/entity/ledgerInvitePreview";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { createLogger } from "internal/shared/logging/logger";

export type { LedgerInvitePreview } from "internal/ledger/entity/ledgerInvitePreview";

export async function loadLedgerInvitePreview(
  token: string,
): Promise<LedgerInvitePreview> {
  const logger = createLogger("ledger-invite-preview");

  try {
    const dependencies = await createServerRequestDependencies();
    return await createRequestContainer(
      dependencies,
    ).ledger.invitePreviewService.load(token);
  } catch (error) {
    logger.error("[ledgerInvite] failed to load invite preview", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return invalidLedgerInvitePreview;
  }
}
