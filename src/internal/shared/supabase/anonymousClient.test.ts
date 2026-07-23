// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

const createSupabaseClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createSupabaseClientMock,
}));

import { createAnonymousSupabaseClient } from "internal/shared/supabase/anonymousClient";

afterEach(() => {
  vi.unstubAllEnvs();
  createSupabaseClientMock.mockReset();
});

describe("createAnonymousSupabaseClient", () => {
  it("使用 publishable key 创建不持久化 Session 的 Client", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    createAnonymousSupabaseClient();

    expect(createSupabaseClientMock).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "publishable-key",
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: false,
          persistSession: false,
        }),
      }),
    );
  });

  it("缺少环境变量时抛出错误", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(() => createAnonymousSupabaseClient()).toThrow();
  });
});
