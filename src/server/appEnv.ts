import type { RequestContainer } from "server/container";
import type { RequestDependencies } from "server/shared/context/requestDependencies";

/**
 * Hono Context 的类型化 Variables。Controller 通过 c.get("container")
 * 取得 Request Container；requestId 供日志和错误响应使用。
 */
export type AppEnv = {
  Variables: {
    requestId: string;
    requestDependencies: RequestDependencies;
    container: RequestContainer;
  };
};
