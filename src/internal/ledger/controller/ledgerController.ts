import type { z } from "@hono/zod-openapi";

import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import {
  createLedgerInviteRequestSchema,
  createLedgerRequestSchema,
  ledgerIdParamsSchema,
  ledgerInviteParamsSchema,
  switchCurrentLedgerRequestSchema,
  updateLedgerSettingsRequestSchema,
} from "internal/ledger/schema";
import { requireAuthenticatedUserId } from "internal/shared/auth/authContext";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type CreateLedgerRequest = z.infer<typeof createLedgerRequestSchema>;
type SwitchCurrentLedgerRequest = z.infer<
  typeof switchCurrentLedgerRequestSchema
>;
type LedgerIdParams = z.infer<typeof ledgerIdParamsSchema>;
type UpdateLedgerSettingsRequest = z.infer<
  typeof updateLedgerSettingsRequestSchema
>;
type CreateLedgerInviteRequest = z.infer<
  typeof createLedgerInviteRequestSchema
>;
type LedgerInviteParams = z.infer<typeof ledgerInviteParamsSchema>;

export const createLedgerHandler = async (
  c: ControllerContext<{ json: CreateLedgerRequest }>,
) => {
  requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c.get("container").ledger.service.create(c.req.valid("json"));
  revalidateLedgerMutation();
  return c.json({ ok: true as const }, 201);
};

export const switchCurrentLedgerHandler = async (
  c: ControllerContext<{ json: SwitchCurrentLedgerRequest }>,
) => {
  const userId = requireAuthenticatedUserId(c.get("requestDependencies").auth);
  await c
    .get("container")
    .ledger.currentLedgerService.switch({ ...c.req.valid("json"), userId });
  revalidateLedgerMutation();
  return c.json({ ok: true as const }, 200);
};

export const updateLedgerSettingsHandler = async (
  c: ControllerContext<{
    json: UpdateLedgerSettingsRequest;
    param: LedgerIdParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId } = c.req.valid("param");
  const body = c.req.valid("json");
  await c.get("container").ledger.settingsService.update(
    body.intent === "ledger"
      ? {
          intent: "ledger",
          ledgerId,
          settings: {
            baseCurrency: body.baseCurrency,
            ledgerName: body.ledgerName,
          },
          userId,
        }
      : {
          intent: "member",
          ledgerId,
          settings: {
            displayColor: body.displayColor,
            displayName: body.displayName,
            role: body.role,
            userId: body.userId,
          },
          userId,
        },
  );
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json({ ok: true as const }, 200);
};

export const createLedgerInviteHandler = async (
  c: ControllerContext<{
    json: CreateLedgerInviteRequest;
    param: LedgerIdParams;
  }>,
) => {
  const userId = requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId } = c.req.valid("param");
  const result = await c.get("container").ledger.inviteService.create({
    ledgerId,
    role: c.req.valid("json").role,
    userId,
  });
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json(result, 201);
};

export const revokeLedgerInviteHandler = async (
  c: ControllerContext<{ param: LedgerInviteParams }>,
) => {
  const userId = requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId, inviteId } = c.req.valid("param");
  await c
    .get("container")
    .ledger.inviteService.revoke({ inviteId, ledgerId, userId });
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json({ ok: true as const }, 200);
};

export const listPendingLedgerInvitesHandler = async (
  c: ControllerContext<{ param: LedgerIdParams }>,
) => {
  const userId = requireAuthenticatedUserId(c.get("requestDependencies").auth);
  const { ledgerId } = c.req.valid("param");
  const invites = await c
    .get("container")
    .ledger.inviteService.listPending({ ledgerId, userId });
  return c.json({ invites }, 200);
};
