import type { z } from "@hono/zod-openapi";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";
import type {
  transactionLedgerQuerySchema,
  merchantEntrySuggestionsQuerySchema,
} from "internal/transaction/schema";

export async function frequentMerchantsHandler(
  c: ControllerContext<{ query: z.infer<typeof transactionLedgerQuerySchema> }>,
) {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  return c.json(
    await c
      .get("container")
      .transaction.merchantEntryQueryService.getFrequentMerchants(
        c.req.valid("query"),
      ),
    200,
  );
}

export async function merchantEntrySuggestionsHandler(
  c: ControllerContext<{
    query: z.infer<typeof merchantEntrySuggestionsQuerySchema>;
  }>,
) {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  return c.json(
    await c
      .get("container")
      .transaction.merchantEntryQueryService.getMerchantSuggestions(
        c.req.valid("query"),
      ),
    200,
  );
}
