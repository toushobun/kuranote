import { describe, expect, it } from "vitest";

import { getSafeNextPath, isSafeNextPath } from "./safeNextPath";

describe("safeNextPath", () => {
  it("站内路径校验通过", () => {
    expect(isSafeNextPath("/transactions/new?type=expense")).toBe(true);
  });

  it.each(["https://evil.example.com", "//evil.example.com", "/\\evil"])(
    "站外或可疑路径 %s 校验失败",
    (value) => {
      expect(isSafeNextPath(value)).toBe(false);
    },
  );

  it("getSafeNextPath 返回合法站内路径", () => {
    expect(getSafeNextPath("/transactions/new?type=transfer")).toBe(
      "/transactions/new?type=transfer",
    );
  });

  it.each([undefined, null, "", "https://evil.example.com", new Blob()])(
    "getSafeNextPath 对非法值 %s 返回 null",
    (value) => {
      expect(getSafeNextPath(value)).toBeNull();
    },
  );
});
