import { z } from "zod";
import {
  ledgerSettingsErrorCodes,
  ledgerSettingsErrorMessages,
} from "internal/ledger/errors/ledgerSettings";

export const ledgerDeletionSchema = z.object({
  ledgerId: z.uuid({
    error: ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.ledgerInvalid],
  }),
  confirmationName: z.string({
    error:
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.deleteNameMismatch],
  }),
});
