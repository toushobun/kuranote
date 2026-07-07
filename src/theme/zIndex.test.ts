import { describe, expect, it } from "vitest";

import { amountKeypadZIndex, appZIndex } from "./zIndex";

describe("appZIndex", () => {
  it("下拉菜单显示在弹框之上且不遮挡提示", () => {
    expect(appZIndex.dropdown).toBeGreaterThan(appZIndex.dialog);
    expect(appZIndex.dropdown).toBeLessThan(appZIndex.tooltip);
  });

  it("金额键盘层级高于弹框和下拉菜单，但不高于提示", () => {
    expect(amountKeypadZIndex).toBeGreaterThan(appZIndex.dialog);
    expect(amountKeypadZIndex).toBeGreaterThan(appZIndex.dropdown);
    expect(amountKeypadZIndex).toBeLessThan(appZIndex.tooltip);
  });
});
