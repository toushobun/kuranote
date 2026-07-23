// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { getAuthContext } from "internal/shared/auth/authContext";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";

function createSupabaseStub(user: { id: string; email?: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  } as unknown as AuthenticatedSupabaseClient;
}

describe("getAuthContext", () => {
  it("已登录时返回 isAuthenticated: true 与用户信息", async () => {
    const supabase = createSupabaseStub({
      email: "user@example.com",
      id: "user-1",
    });

    await expect(getAuthContext(supabase)).resolves.toEqual({
      email: "user@example.com",
      isAuthenticated: true,
      userId: "user-1",
    });
  });

  it("未登录时返回 isAuthenticated: false", async () => {
    const supabase = createSupabaseStub(null);

    await expect(getAuthContext(supabase)).resolves.toEqual({
      email: null,
      isAuthenticated: false,
      userId: null,
    });
  });
});
