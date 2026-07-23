import { handle } from "hono/vercel";

import { apiRouter } from "internal/router";

// 锁定 Hono、Supabase、cookies 及后端基础设施的运行时假设，
// 避免未来被无意切换为 Edge Runtime。
export const runtime = "nodejs";

const handler = handle(apiRouter);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
