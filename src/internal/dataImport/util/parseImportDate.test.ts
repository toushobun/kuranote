import { describe, expect, it } from "vitest";

import { parseImportDate } from "internal/dataImport/util/parseImportDate";

describe("parseImportDate", () => {
  it("解析合法的 YYYY-MM-DD 日期", () => {
    expect(parseImportDate("2026-01-05")).toEqual({
      ok: true,
      value: "2026-01-05",
    });
  });

  it("去除首尾空白", () => {
    expect(parseImportDate(" 2026-01-05 ")).toEqual({
      ok: true,
      value: "2026-01-05",
    });
  });

  it("拒绝日历上不存在的日期", () => {
    expect(parseImportDate("2026-02-30")).toEqual({ ok: false });
    expect(parseImportDate("2026-13-01")).toEqual({ ok: false });
  });

  it("拒绝非零填充或其他格式", () => {
    expect(parseImportDate("2026-1-5")).toEqual({ ok: false });
    expect(parseImportDate("2026/01/05")).toEqual({ ok: false });
    expect(parseImportDate("2026-01-05T00:00:00Z")).toEqual({ ok: false });
  });

  it("拒绝空字符串", () => {
    expect(parseImportDate("")).toEqual({ ok: false });
  });

  it("正确识别闰年 2 月 29 日", () => {
    expect(parseImportDate("2028-02-29")).toEqual({
      ok: true,
      value: "2028-02-29",
    });
    expect(parseImportDate("2026-02-29")).toEqual({ ok: false });
  });
});
