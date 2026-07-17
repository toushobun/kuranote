import { z } from "@hono/zod-openapi";

/**
 * 多个模块稳定复用的分页查询参数片段。模块专用的筛选条件、
 * 枚举和响应结构仍放在模块自身的 schema.ts / schema/ 中。
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .openapi({ example: 20 }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
