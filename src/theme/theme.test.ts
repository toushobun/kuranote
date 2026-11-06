import { describe, expect, it } from "vitest";

import { designTokens, theme } from "./theme";

describe("theme", () => {
  it("通用折叠时长由 motion.collapse 提供", () => {
    expect(designTokens.motion.collapse).toBe(280);
  });

  it("商家预设地区与分类共用展开和收起时长", () => {
    expect(designTokens.motion.presetDisclosure.duration).toEqual({
      enter: 220,
      exit: 180,
    });
  });

  it("系统开启减少动态效果时 Collapse 不播放动画", () => {
    expect(theme.components?.MuiCollapse?.styleOverrides?.root).toEqual({
      "@media (prefers-reduced-motion: reduce)": {
        transitionDuration: "0ms !important",
      },
    });
  });
});
