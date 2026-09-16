import { describe, expect, it } from "vitest";

import { parseCsv } from "internal/dataImport/util/csvParser";

describe("parseCsv", () => {
  it("解析普通逗号分隔的多行文本", () => {
    expect(parseCsv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("去除 UTF-8 BOM", () => {
    expect(parseCsv("﻿a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("支持 \\r\\n 换行", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("支持双引号包裹字段内的逗号", () => {
    expect(parseCsv('a,"1,234",c')).toEqual([["a", "1,234", "c"]]);
  });

  it('支持双引号转义（""）表示字段内的双引号', () => {
    expect(parseCsv('a,"say ""hi""",c')).toEqual([["a", 'say "hi"', "c"]]);
  });

  it("支持字段内换行", () => {
    expect(parseCsv('a,"line1\nline2",c')).toEqual([
      ["a", "line1\nline2", "c"],
    ]);
  });

  it("忽略末尾多余的空行", () => {
    expect(parseCsv("a,b\n1,2\n\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("空字符串返回空数组", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("保留字段中间的空单元格", () => {
    expect(parseCsv("a,,c\n1,,3")).toEqual([
      ["a", "", "c"],
      ["1", "", "3"],
    ]);
  });
});
