import { describe, expect, it } from "vitest";

import { cellToText } from "internal/dataImport/util/cellText";

describe("cellToText", () => {
  it("null / undefined 转换为空字符串", () => {
    expect(cellToText(null)).toBe("");
    expect(cellToText(undefined)).toBe("");
  });

  it("字符串原样返回并去除首尾空白", () => {
    expect(cellToText("  你好  ")).toBe("你好");
  });

  it("数字转换为字符串", () => {
    expect(cellToText(123.45)).toBe("123.45");
  });

  it("Date 转换为 YYYY-MM-DD（按 UTC）", () => {
    expect(cellToText(new Date(Date.UTC(2026, 0, 5)))).toBe("2026-01-05");
  });

  it("富文本对象拼接各段文字", () => {
    expect(
      cellToText({
        richText: [{ text: "你好" }, { text: "世界" }],
      }),
    ).toBe("你好世界");
  });

  it("公式结果取 result 字段", () => {
    expect(cellToText({ formula: "SUM(A1:A2)", result: 42 })).toBe("42");
  });

  it("超链接单元格取显示文本", () => {
    expect(cellToText({ hyperlink: "https://example.com", text: "示例" })).toBe(
      "示例",
    );
  });
});
