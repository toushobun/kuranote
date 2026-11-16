import { describe, expect, it } from "vitest";
import { shouldFollowLinkedField } from "./linkedFieldAutoFill";

describe("shouldFollowLinkedField", () => {
  it("首次可自动带出时，只补全尚空的字段", () => {
    expect(shouldFollowLinkedField("", undefined, false, true)).toBe(true);
    expect(shouldFollowLinkedField("", undefined, true, true)).toBe(true);
    expect(shouldFollowLinkedField("x", undefined, true, true)).toBe(false);
  });
  it("曾自动填写的字段改选原支出时跟随，即使后来手动修改或清空", () => {
    expect(shouldFollowLinkedField("old", true, true, false)).toBe(true);
    expect(shouldFollowLinkedField("changed", true, true, false)).toBe(true);
    expect(shouldFollowLinkedField("", true, true, false)).toBe(true);
    expect(shouldFollowLinkedField("old", true, false, false)).toBe(false);
  });
  it("之前没自动带出的字段即使已被清空，后续换原支出或只改金额都不补填", () => {
    expect(shouldFollowLinkedField("", undefined, true, false)).toBe(false);
    expect(shouldFollowLinkedField("", undefined, false, false)).toBe(false);
  });
});
