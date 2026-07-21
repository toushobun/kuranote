// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { googleAuthNextPathMaxLength } from "lib/auth/googleOAuth";
import { startGoogleAuth } from "server/auth/adapter/next/actions";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  startGoogleAuth: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockResolvedValue(
    new Headers({ origin: "https://kuranote.test" }),
  );
  mocks.createServerRequestDependencies.mockResolvedValue({});
  mocks.createRequestContainer.mockReturnValue({
    auth: { service: { startGoogleAuth: mocks.startGoogleAuth } },
  });
  mocks.startGoogleAuth.mockResolvedValue({
    ok: true,
    providerUrl: "https://accounts.google.test/oauth",
  });
});

describe("startGoogleAuth nextPath 边界", () => {
  it("Server Action 会在调用 Service 前把超长 nextPath 退回首页", async () => {
    const oversizedNextPath = `/${"x".repeat(googleAuthNextPathMaxLength)}`;

    await expect(startGoogleAuth("login", oversizedNextPath)).rejects.toThrow(
      "NEXT_REDIRECT:https://accounts.google.test/oauth",
    );

    expect(mocks.startGoogleAuth).toHaveBeenCalledWith({
      nextPath: "/dashboard",
      requestOrigin: "https://kuranote.test",
      source: "login",
    });
  });
});
