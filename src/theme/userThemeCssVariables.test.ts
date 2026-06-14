import { describe, expect, it } from "vitest";

import { getUserThemeCssVariables } from "./userThemeCssVariables";

describe("getUserThemeCssVariables", () => {
  it("输出默认主题的交易相关用户主题变量", () => {
    const themeVars = getUserThemeCssVariables("lavender_dream");

    expect(themeVars["--user-theme-tx-summary-bg"]).toBe("#e8e0f8");
    expect(themeVars["--user-theme-tx-nav-bg"]).toBe("#f4efff");
    expect(themeVars["--user-theme-tx-avatar-bg"]).toBe("#f4efff");
    expect(themeVars["--user-theme-tx-accent"]).toBe("#6d4bb3");
    expect(themeVars["--user-theme-tx-border"]).toBe("#e5dcf6");
  });

  it("输出琥珀暖阳的交易相关用户主题变量", () => {
    const themeVars = getUserThemeCssVariables("amber_sun");

    expect(themeVars["--user-theme-tx-summary-bg"]).toBe("#fef3c7");
    expect(themeVars["--user-theme-tx-nav-bg"]).toBe("#ffedd5");
    expect(themeVars["--user-theme-tx-avatar-bg"]).toBe("#fef3c7");
    expect(themeVars["--user-theme-tx-accent"]).toBe("#d97706");
    expect(themeVars["--user-theme-tx-border"]).toBe(
      "rgba(251, 191, 36, 0.42)",
    );
  });

  it("输出深海星光的交易相关用户主题变量", () => {
    const themeVars = getUserThemeCssVariables("deep_sea_starlight");

    expect(themeVars["--user-theme-tx-summary-bg"]).toBe("#e0e7ff");
    expect(themeVars["--user-theme-tx-nav-bg"]).toBe("#eef2ff");
    expect(themeVars["--user-theme-tx-avatar-bg"]).toBe("#e0e7ff");
    expect(themeVars["--user-theme-tx-accent"]).toBe("#4f46e5");
    expect(themeVars["--user-theme-tx-border"]).toBe(
      "rgba(129, 140, 248, 0.4)",
    );
  });

  it("为浅色按钮主题输出可覆盖的文字色变量", () => {
    expect(getUserThemeCssVariables("amber_sun")["--user-theme-fab-text"]).toBe(
      "#78350f",
    );
    expect(
      getUserThemeCssVariables("lemon_gold")["--user-theme-fab-text"],
    ).toBe("#713f12");
    expect(
      getUserThemeCssVariables("white_porcelain")["--user-theme-fab-text"],
    ).toBe("#1e293b");
  });

  it("为普通按钮主题输出白色文字色变量", () => {
    expect(
      getUserThemeCssVariables("lavender_dream")["--user-theme-fab-text"],
    ).toBe("#ffffff");
  });
});
