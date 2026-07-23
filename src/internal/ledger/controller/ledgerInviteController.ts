import type { z } from "@hono/zod-openapi";

import { revalidateLedgerMutation } from "internal/ledger/adapter/next/revalidateLedger";
import { acceptLedgerInviteRequestSchema } from "internal/ledger/schema";
import type { ControllerContext } from "internal/shared/http/controllerContext";

type AcceptLedgerInviteRequest = z.infer<
  typeof acceptLedgerInviteRequestSchema
>;

/**
 * Controller 只负责：读取并校验请求（由 Schema 完成）、调用 Service、
 * 在 Service 成功后触发模块级缓存失效、选择成功状态码。
 * 业务规则、权限判断和数据库访问均不在这里发生。
 */
export const acceptLedgerInviteHandler = async (
  c: ControllerContext<{ json: AcceptLedgerInviteRequest }>,
) => {
  const { token } = c.req.valid("json");
  const container = c.get("container");

  await container.ledger.inviteService.accept(token);
  revalidateLedgerMutation();

  return c.json({ ok: true as const }, 200);
};
