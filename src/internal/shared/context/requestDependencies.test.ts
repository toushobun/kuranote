// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("internal/shared/supabase/authenticatedClient", () => ({
  createAuthenticatedSupabaseClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { email: "a@b.com", id: "u1" } } }),
    },
  }),
}));

import { createRequestDependencies } from "internal/shared/context/requestDependencies";

describe("createRequestDependencies", () => {
  it("组装 requestId、logger、auth 和 supabase", async () => {
    const dependencies = await createRequestDependencies();

    expect(dependencies.requestId).toEqual(expect.any(String));
    expect(dependencies.auth).toEqual({
      email: "a@b.com",
      isAuthenticated: true,
      userId: "u1",
    });
    expect(dependencies.logger).toBeDefined();
    expect(dependencies.supabase).toBeDefined();
  });

  it("每次调用生成不同的 requestId", async () => {
    const first = await createRequestDependencies();
    const second = await createRequestDependencies();

    expect(first.requestId).not.toBe(second.requestId);
  });
});
