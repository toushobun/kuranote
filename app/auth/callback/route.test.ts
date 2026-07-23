import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  handleGoogleOAuthCallback: vi.fn(),
}));

vi.mock("internal/auth/adapter/next/googleOAuthCallback", () => ({
  handleGoogleOAuthCallback: mocks.handleGoogleOAuthCallback,
}));

describe("Google OAuth callback route", () => {
  it("把原始 Request 交给 auth 模块 Next 适配层", async () => {
    const request = new Request(
      "https://kuranote.test/auth/callback?code=code-123",
    );
    const expected = Response.redirect("https://kuranote.test/dashboard");
    mocks.handleGoogleOAuthCallback.mockResolvedValue(expected);

    await expect(GET(request)).resolves.toBe(expected);
    expect(mocks.handleGoogleOAuthCallback).toHaveBeenCalledWith(request);
  });
});
