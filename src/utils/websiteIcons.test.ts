import { describe, expect, it } from "vitest";
import { buildWebsiteFaviconUrl } from "./websiteIcons";

describe("buildWebsiteFaviconUrl", () => {
  it("有官网时生成 Google favicon 请求地址", () => {
    expect(buildWebsiteFaviconUrl("https://example.com")).toBe(
      "https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com&sz=128",
    );
  });

  it("带路径与查询参数的官网只取 origin", () => {
    expect(
      buildWebsiteFaviconUrl("https://www.skylark.co.jp/gusto/?from=top#menu"),
    ).toBe(
      "https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fwww.skylark.co.jp&sz=128",
    );
  });

  it("无官网或官网无效时返回 null", () => {
    expect(buildWebsiteFaviconUrl(null)).toBeNull();
    expect(buildWebsiteFaviconUrl("")).toBeNull();
    expect(buildWebsiteFaviconUrl("ftp://example.com")).toBeNull();
    expect(buildWebsiteFaviconUrl("https:example.com")).toBeNull();
    expect(buildWebsiteFaviconUrl("HTTPS://example.com")).toBeNull();
    expect(buildWebsiteFaviconUrl("not a url")).toBeNull();
  });
});
