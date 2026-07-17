// @vitest-environment node

import { describe, expect, it } from "vitest";

import { RepositoryError } from "server/shared/errors/appError";
import { toRepositoryError } from "server/shared/supabase/repositoryError";

describe("toRepositoryError", () => {
  it("把 code 和安全的 message 包装成 RepositoryError，不携带原始 Supabase 错误", () => {
    const error = toRepositoryError("load_failed", "加载失败，请稍后重试。");

    expect(error).toBeInstanceOf(RepositoryError);
    expect(error.code).toBe("load_failed");
    expect(error.message).toBe("加载失败，请稍后重试。");
  });
});
