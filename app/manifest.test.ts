import { describe, expect, it } from "vitest";

import { defaultUserThemeKey, userThemeTokens } from "theme/userThemeTokens";
import manifest from "./manifest";

describe("manifest", () => {
  it("安装回退颜色来自默认用户主题", () => {
    const defaultThemePalette = userThemeTokens[defaultUserThemeKey].palette;

    expect(manifest()).toMatchObject({
      background_color: defaultThemePalette.page,
      theme_color: defaultThemePalette.pageGradientFrom,
    });
  });
});
