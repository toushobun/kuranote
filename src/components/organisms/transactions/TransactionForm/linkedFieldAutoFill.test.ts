import { describe, expect, it } from "vitest";
import { shouldFollowLinkedField } from "./linkedFieldAutoFill";

describe("shouldFollowLinkedField", () => {
  it("字段未曾自动填写时，仅允许空字段首次自动带出", () => {
    expect(shouldFollowLinkedField("", undefined, false)).toBe(true);
    expect(shouldFollowLinkedField(undefined, undefined, true)).toBe(true);
    expect(shouldFollowLinkedField("manual", undefined, true)).toBe(false);
  });
  it("曾自动填写的字段改选原支出时跟随，即使后来手动修改或清空", () => {
    expect(shouldFollowLinkedField("old", true, true)).toBe(true);
    expect(shouldFollowLinkedField("changed", true, true)).toBe(true);
    expect(shouldFollowLinkedField("", true, true)).toBe(true);
    expect(shouldFollowLinkedField("old", true, false)).toBe(false);
  });
  it("没有自动带出资格的非空字段在换原支出时不受影响", () => {
    expect(shouldFollowLinkedField("manual", false, true)).toBe(false);
    expect(shouldFollowLinkedField("manual", false, false)).toBe(false);
  });
});
