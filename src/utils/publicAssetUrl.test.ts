import { describe, expect, it } from "vitest";

import { publicAssetUrl } from "./publicAssetUrl";

describe("publicAssetUrl", () => {
  it("正式页面保持站点根路径", () => {
    expect(publicAssetUrl("/assets/icon.png", "/merchants")).toBe(
      "/assets/icon.png",
    );
  });

  it("本地 Storybook 保持站点根路径", () => {
    expect(publicAssetUrl("/assets/icon.png", "/iframe.html")).toBe(
      "/assets/icon.png",
    );
  });

  it("子目录部署的 Storybook 补充部署前缀", () => {
    expect(
      publicAssetUrl("/assets/icon.png", "/kuranote/pr-652/iframe.html"),
    ).toBe("/kuranote/pr-652/assets/icon.png");
  });
});
