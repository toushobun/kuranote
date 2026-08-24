import { describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";

const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import RootPage from "./page";

describe("RootPage", () => {
  it("根路径默认重定向到 dashboard", () => {
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    expect(() => RootPage()).toThrow(`NEXT_REDIRECT:${routePaths.dashboard}`);
    expect(mocks.redirect).toHaveBeenCalledWith(routePaths.dashboard);
  });
});
