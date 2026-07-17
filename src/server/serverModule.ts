import type { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "server/appEnv";

export type ServerModule = {
  name: string;
  basePath: string;
  router: OpenAPIHono<AppEnv>;
};
