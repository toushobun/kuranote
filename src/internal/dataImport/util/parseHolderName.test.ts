import { describe, expect, it } from "vitest";

import { parseHolderName } from "internal/dataImport/util/parseHolderName";

describe("parseHolderName", () => {
  it("空字符串解析为 null（0 个持有人）", () => {
    expect(parseHolderName("")).toBeNull();
    expect(parseHolderName("   ")).toBeNull();
  });

  it("单个持有人姓名去除首尾空白后原样返回", () => {
    expect(parseHolderName(" 鄧 ")).toBe("鄧");
  });

  it("即使内容包含分号也按普通字符串整体处理，不做拆分", () => {
    expect(parseHolderName("鄧;聶")).toBe("鄧;聶");
  });
});
