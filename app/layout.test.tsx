import { describe, expect, it } from "vitest";

import { metadata, viewport } from "./layout";

describe("RootLayout", () => {
  it("为 iOS 主屏幕应用启用覆盖状态栏的视口与状态栏模式", () => {
    expect(viewport).toMatchObject({ viewportFit: "cover" });
    expect(metadata.appleWebApp).toMatchObject({
      capable: true,
      statusBarStyle: "black-translucent",
    });
  });
});
