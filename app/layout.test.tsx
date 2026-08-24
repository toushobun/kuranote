import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

import { generateViewport, metadata } from "./layout";

describe("RootLayout", () => {
  beforeEach(() => {
    cookieGet.mockReset();
  });

  it("为 iOS 主屏幕应用启用全屏视口与可读状态栏模式", async () => {
    await expect(generateViewport()).resolves.toMatchObject({
      themeColor: "#FEF3DC",
      viewportFit: "cover",
    });
    expect(metadata.appleWebApp).toMatchObject({
      capable: true,
      statusBarStyle: "default",
    });
  });

  it("根据用户主题输出与页面顶部一致的状态栏颜色", async () => {
    cookieGet.mockReturnValue({ value: "lavenderDream" });

    await expect(generateViewport()).resolves.toMatchObject({
      themeColor: "#F3EFFC",
    });
  });
});
