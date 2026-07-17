import { cache } from "react";

import {
  createRequestDependencies,
  type RequestDependencies,
} from "server/shared/context/requestDependencies";

/**
 * Server Component / Layout 专用的 Request Dependencies 入口。
 *
 * 用 React.cache() 包装，保证同一次 Server Component 渲染请求中，
 * layout.tsx、page.tsx 和嵌套 Server Component 重复调用时，
 * 只创建一次认证用户 / Session / Supabase Client，不重复查询。
 *
 * 该缓存仅用于 Server Component 渲染路径，不用于 Hono Route Handler；
 * 缓存范围为单次服务端请求，不跨用户或跨请求共享。
 */
export const createServerRequestDependencies = cache(
  (): Promise<RequestDependencies> => createRequestDependencies(),
);
