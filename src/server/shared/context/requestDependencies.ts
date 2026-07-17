import {
  getAuthContext,
  type AuthContext,
} from "server/shared/auth/authContext";
import { createLogger, type Logger } from "server/shared/logging/logger";
import {
  createAuthenticatedSupabaseClient,
  type AuthenticatedSupabaseClient,
} from "server/shared/supabase/authenticatedClient";
import { createRequestId } from "server/shared/context/requestId";

/**
 * 一次请求期间需要共享的、与框架无关的信息。
 * 不得把 ledgerId、transactionId 等具体业务参数塞进这里，
 * 这些参数应显式传给 Service。
 */
export type RequestDependencies = {
  requestId: string;
  auth: AuthContext;
  logger: Logger;
  supabase: AuthenticatedSupabaseClient;
};

/**
 * 与 Hono / Next.js 都无关的请求依赖工厂。
 * Hono middleware 和 Server Component 的 SSR 入口都调用它来创建
 * 同一形状的 RequestDependencies，因此两条路径可以复用完全相同的
 * Container / Service / Repository。
 */
export async function createRequestDependencies(): Promise<RequestDependencies> {
  const requestId = createRequestId();
  const logger = createLogger(requestId);
  const supabase = await createAuthenticatedSupabaseClient();
  const auth = await getAuthContext(supabase);

  return { auth, logger, requestId, supabase };
}
