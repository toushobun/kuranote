import { describe, expect, it } from "vitest";

import { settingsEntryButtonSx } from "./settingsEntryButtonSx";

describe("settingsEntryButtonSx", () => {
  it("定义设置入口按钮的用户主题样式", () => {
    expect(settingsEntryButtonSx["&:not(.Mui-disabled)"].background).toBe(
      "var(--user-theme-fab-bg)",
    );
    expect(settingsEntryButtonSx["&:not(.Mui-disabled)"].color).toBe(
      "var(--user-theme-fab-text)",
    );
    expect(settingsEntryButtonSx["&:not(.Mui-disabled):hover"].background).toBe(
      "var(--user-theme-fab-bg)",
    );
    expect(settingsEntryButtonSx["&:not(.Mui-disabled):hover"].filter).toBe(
      "brightness(0.92)",
    );
  });
});
