import { describe, expect, it } from "vitest";

import { parseHolderName } from "internal/dataImport/util/parseHolderName";

describe("parseHolderName", () => {
  it("空字符串解析为 null（0 个持有人）", () => {
    expect(parseHolderName("")).toEqual({ ok: true, value: null });
    expect(parseHolderName("   ")).toEqual({ ok: true, value: null });
  });

  it("单个持有人姓名去除首尾空白后原样返回", () => {
    expect(parseHolderName(" 鄧 ")).toEqual({ ok: true, value: "鄧" });
  });

  it("包含英文分号时判定为格式错误（历史上用于分隔多个持有人）", () => {
    expect(parseHolderName("鄧;聶")).toEqual({ ok: false });
  });

  it("包含中文分号时判定为格式错误", () => {
    expect(parseHolderName("鄧；聶")).toEqual({ ok: false });
  });
});
