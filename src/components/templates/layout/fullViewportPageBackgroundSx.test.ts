import { describe, expect, it } from "vitest";

import { fullViewportPageBackgroundSx } from "./fullViewportPageBackgroundSx";

describe("fullViewportPageBackgroundSx", () => {
  it("使用用户主题页面背景覆盖完整视口", () => {
    expect(fullViewportPageBackgroundSx).toEqual({
      background: "var(--user-theme-page-bg)",
      inset: 0,
      position: "fixed",
      zIndex: -1,
    });
  });
});
