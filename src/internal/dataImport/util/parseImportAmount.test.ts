import { describe, expect, it } from "vitest";

import { parseImportAmount } from "internal/dataImport/util/parseImportAmount";

describe("parseImportAmount", () => {
  it("解析整数金额", () => {
    expect(parseImportAmount("100")).toEqual({ ok: true, value: 100 });
  });

  it("解析最多两位小数的金额", () => {
    expect(parseImportAmount("99.9")).toEqual({ ok: true, value: 99.9 });
    expect(parseImportAmount("99.99")).toEqual({ ok: true, value: 99.99 });
  });

  it("去除首尾空白", () => {
    expect(parseImportAmount(" 100 ")).toEqual({ ok: true, value: 100 });
  });

  it("拒绝超过两位小数", () => {
    expect(parseImportAmount("99.999")).toEqual({ ok: false });
  });

  it("拒绝负数", () => {
    expect(parseImportAmount("-100")).toEqual({ ok: false });
  });

  it("拒绝非数字文本", () => {
    expect(parseImportAmount("abc")).toEqual({ ok: false });
    expect(parseImportAmount("1,000")).toEqual({ ok: false });
    expect(parseImportAmount("")).toEqual({ ok: false });
  });

  it("默认允许 0", () => {
    expect(parseImportAmount("0")).toEqual({ ok: true, value: 0 });
  });

  it("allowZero: false 时拒绝 0", () => {
    expect(parseImportAmount("0", { allowZero: false })).toEqual({
      ok: false,
    });
  });
});
