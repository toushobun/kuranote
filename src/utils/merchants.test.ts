import { describe, expect, it } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import {
  filterMerchantsByKeyword,
  getMerchantInitial,
  normalizeSearchText,
  resolveMerchantDisplayName,
} from "utils/merchants";

describe("getMerchantInitial", () => {
  it("英文商家名返回大写首字母", () => {
    expect(getMerchantInitial("amazon")).toBe("A");
  });

  it("中文商家名返回第一个字符", () => {
    expect(getMerchantInitial("罗森")).toBe("罗");
  });

  it("日文商家名返回第一个字符", () => {
    expect(getMerchantInitial("スギ薬局")).toBe("ス");
  });

  it("空字符串返回 fallback", () => {
    expect(getMerchantInitial("")).toBe("?");
  });

  it("取首字母前会去掉前后空格", () => {
    expect(getMerchantInitial("  life")).toBe("L");
  });
});

describe("normalizeSearchText", () => {
  it("会去掉前后空格", () => {
    expect(normalizeSearchText("  LIFE  ")).toBe("life");
  });

  it("会将英文文本转为小写", () => {
    expect(normalizeSearchText("Amazon")).toBe("amazon");
  });

  it("中文文本保持原样用于搜索", () => {
    expect(normalizeSearchText(" 来福 ")).toBe("来福");
  });

  it("日文文本保持原样用于搜索", () => {
    expect(normalizeSearchText(" ライフ ")).toBe("ライフ");
  });
});

describe("resolveMerchantDisplayName", () => {
  it("首选别名存在时使用首选别名", () => {
    expect(resolveMerchantDisplayName("LIFE超市", "来福")).toBe("来福");
  });

  it("没有首选别名时使用正式名", () => {
    expect(resolveMerchantDisplayName("LIFE超市", null)).toBe("LIFE超市");
  });
});

describe("filterMerchantsByKeyword", () => {
  const merchants = [
    createMerchantRow({
      aliases: [createMerchantAliasRow({ alias: "来福" })],
      name: "LIFE超市",
    }),
    createMerchantRow({
      id: "00000000-0000-4000-8000-000000001002",
      name: "Amazon",
    }),
  ];

  it("别名包含搜索词时返回对应商家", () => {
    expect(filterMerchantsByKeyword(merchants, " 来福 ")).toEqual([
      merchants[0],
    ]);
  });

  it("正式名匹配不区分英文大小写", () => {
    expect(filterMerchantsByKeyword(merchants, "amazon")).toEqual([
      merchants[1],
    ]);
  });

  it("空搜索词返回原列表", () => {
    expect(filterMerchantsByKeyword(merchants, "  ")).toBe(merchants);
  });
});
