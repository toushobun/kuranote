import { describe, expect, it } from "vitest";

import { designTokens, theme } from "./theme";

describe("theme", () => {
  it("折叠动画时长统一由 motion.collapse 提供", () => {
    expect(designTokens.motion.collapse).toBe(280);
  });

  it("系统开启减少动态效果时 Collapse 不播放动画", () => {
    expect(theme.components?.MuiCollapse?.styleOverrides?.root).toEqual({
      "@media (prefers-reduced-motion: reduce)": {
        transitionDuration: "0ms !important",
      },
    });
  });
});
