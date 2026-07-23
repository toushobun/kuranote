import type { RouteHandler } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";
import type { acceptLedgerInviteRoute } from "internal/ledger/router";
import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
/**
 * Controller 只负责：读取并校验请求（由 Schema 完成）、调用 Service、
 * 在 Service 成功后触发模块级缓存失效、选择成功状态码。
 * 业务规则、权限判断和数据库访问均不在这里发生。
 */
export const acceptLedgerInviteHandler: RouteHandler<
  typeof acceptLedgerInviteRoute,
  AppEnv
> = async (c) => {
  const { token } = c.req.valid("json");
  const container = c.get("container");

  await container.ledger.inviteService.accept(token);
  revalidateLedgerMutation();

  return c.json({ ok: true as const }, 200);
};
