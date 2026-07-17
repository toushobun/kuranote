import { describe, expect, it } from "vitest";

import {
  getCategoryDisplayName,
  getCategoryStoredName,
  getUnicodeCharacterCount,
} from "./categoryNames";

describe("categoryNames", () => {
  it("显示名称会去除与图标字段相同的前缀", () => {
    expect(getCategoryDisplayName("🍽️ 餐饮", "🍽️")).toBe("餐饮");
  });

  it("显示名称会去除用户直接输入的其他图标库前缀", () => {
    expect(getCategoryDisplayName("🍜 拉面", "🍽️")).toBe("拉面");
    expect(getCategoryDisplayName("🍜拉面", "🍽️")).toBe("拉面");
  });

  it("显示名称不会误删普通文本前缀", () => {
    expect(getCategoryDisplayName("家庭 餐饮", "🍽️")).toBe("家庭 餐饮");
  });

  it("保存名称时保留旧页面依赖的 Emoji 前缀且不会重复添加", () => {
    expect(getCategoryStoredName("餐饮", "🍽️")).toBe("🍽️ 餐饮");
    expect(getCategoryStoredName("🍽️ 餐饮", "🍽️")).toBe("🍽️ 餐饮");
    expect(getCategoryStoredName("🍜 餐饮", "🍽️")).toBe("🍽️ 餐饮");
  });

  it("按 Unicode 字符数计算数据库名称长度", () => {
    expect(getUnicodeCharacterCount("🍽️ 餐饮")).toBe(5);
  });
});
