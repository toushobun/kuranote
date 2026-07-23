import type { RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

import type { AppEnv } from "internal/appEnv";
import type {
  createLedgerRoute,
  switchCurrentLedgerRoute,
  updateLedgerSettingsRoute,
  createLedgerInviteRoute,
  revokeLedgerInviteRoute,
  listPendingLedgerInvitesRoute,
} from "internal/ledger/managementRouter";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { AuthenticationError } from "internal/shared/errors/appError";

function requireUserId(c: Context<AppEnv>): string {
  const auth = c.get("requestDependencies").auth;
  if (!auth.isAuthenticated)
    throw new AuthenticationError("auth_required", "请先登录。");
  return auth.userId;
}

export const createLedgerHandler: RouteHandler<
  typeof createLedgerRoute,
  AppEnv
> = async (c) => {
  requireUserId(c);
  await c.get("container").ledger.service.create(c.req.valid("json"));
  revalidateLedgerMutation();
  return c.json({ ok: true as const }, 201);
};

export const switchCurrentLedgerHandler: RouteHandler<
  typeof switchCurrentLedgerRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  await c
    .get("container")
    .ledger.currentLedgerService.switch({ ...c.req.valid("json"), userId });
  revalidateLedgerMutation();
  return c.json({ ok: true as const }, 200);
};

export const updateLedgerSettingsHandler: RouteHandler<
  typeof updateLedgerSettingsRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
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

export const createLedgerInviteHandler: RouteHandler<
  typeof createLedgerInviteRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const result = await c.get("container").ledger.inviteService.create({
    ledgerId,
    role: c.req.valid("json").role,
    userId,
  });
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json(result, 201);
};

export const revokeLedgerInviteHandler: RouteHandler<
  typeof revokeLedgerInviteRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId, inviteId } = c.req.valid("param");
  await c
    .get("container")
    .ledger.inviteService.revoke({ inviteId, ledgerId, userId });
  revalidateLedgerMutation([`/ledgers/${ledgerId}/settings`]);
  return c.json({ ok: true as const }, 200);
};

export const listPendingLedgerInvitesHandler: RouteHandler<
  typeof listPendingLedgerInvitesRoute,
  AppEnv
> = async (c) => {
  const userId = requireUserId(c);
  const { ledgerId } = c.req.valid("param");
  const invites = await c
    .get("container")
    .ledger.inviteService.listPending({ ledgerId, userId });
  return c.json({ invites }, 200);
};
