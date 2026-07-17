// @vitest-environment node

import { describe, expect, it } from "vitest";

import { paginationQuerySchema } from "server/shared/schema/pagination";

describe("paginationQuerySchema", () => {
  it("缺省时使用 page=1、pageSize=20", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("把 query string 中的数字字符串强制转换为数字", () => {
    expect(paginationQuerySchema.parse({ page: "2", pageSize: "50" })).toEqual({
      page: 2,
      pageSize: 50,
    });
  });

  it.each([{ page: 0 }, { pageSize: 0 }, { pageSize: 101 }, { page: -1 }])(
    "拒绝超出范围的取值: %o",
    (input) => {
      expect(paginationQuerySchema.safeParse(input).success).toBe(false);
    },
  );
});
