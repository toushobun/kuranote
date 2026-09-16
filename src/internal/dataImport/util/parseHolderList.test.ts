import { describe, expect, it } from "vitest";

import {
  isSameHolderSet,
  parseHolderList,
} from "internal/dataImport/util/parseHolderList";

describe("parseHolderList", () => {
  it("空字符串解析为 0 个持有人", () => {
    expect(parseHolderList("")).toEqual([]);
    expect(parseHolderList("   ")).toEqual([]);
  });

  it("单个持有人", () => {
    expect(parseHolderList("鄧")).toEqual(["鄧"]);
  });

  it("支持英文分号分隔多个持有人", () => {
    expect(parseHolderList("鄧;聶")).toEqual(["鄧", "聶"]);
  });

  it("支持中文分号分隔多个持有人", () => {
    expect(parseHolderList("鄧；聶")).toEqual(["鄧", "聶"]);
  });

  it("去除每一项首尾空白", () => {
    expect(parseHolderList(" 鄧 ; 聶 ")).toEqual(["鄧", "聶"]);
  });

  it("过滤分隔符产生的空项", () => {
    expect(parseHolderList("鄧;;聶;")).toEqual(["鄧", "聶"]);
  });

  it("去重", () => {
    expect(parseHolderList("鄧;鄧;聶")).toEqual(["鄧", "聶"]);
  });
});

describe("isSameHolderSet", () => {
  it("顺序不同但成员相同视为相同集合", () => {
    expect(isSameHolderSet(["鄧", "聶"], ["聶", "鄧"])).toBe(true);
  });

  it("成员数量不同视为不同集合", () => {
    expect(isSameHolderSet(["鄧"], ["鄧", "聶"])).toBe(false);
  });

  it("成员不同视为不同集合", () => {
    expect(isSameHolderSet(["鄧"], ["聶"])).toBe(false);
  });

  it("两个空集合视为相同集合", () => {
    expect(isSameHolderSet([], [])).toBe(true);
  });
});
