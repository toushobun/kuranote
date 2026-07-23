import type { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "internal/appEnv";

export type InternalModule = {
  name: string;
  basePath: string;
  router: OpenAPIHono<AppEnv>;
};
