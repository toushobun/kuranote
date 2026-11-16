import { describe, expect, it } from "vitest";
import { shouldFollowLinkedField } from "./linkedFieldAutoFill";

describe("shouldFollowLinkedField", () => {
  it("字段未曾自动填写时，仅允许空字段首次自动带出", () => {
    expect(shouldFollowLinkedField("", undefined, false)).toBe(true);
    expect(shouldFollowLinkedField(undefined, undefined, true)).toBe(true);
    expect(shouldFollowLinkedField("manual", undefined, true)).toBe(false);
  });
  it("曾自动填写的字段只有改选原支出且仍保留自动值时才能跟随", () => {
    expect(shouldFollowLinkedField("old", "old", true)).toBe(true);
    expect(shouldFollowLinkedField("changed", "old", true)).toBe(false);
    expect(shouldFollowLinkedField("old", "old", false)).toBe(false);
    expect(shouldFollowLinkedField("", "old", true)).toBe(false);
  });
  it("手动改动后即使清空或重新选择原值都不覆盖", () => {
    expect(shouldFollowLinkedField("", null, false)).toBe(false);
    expect(shouldFollowLinkedField("", null, true)).toBe(false);
    expect(shouldFollowLinkedField("old", null, true)).toBe(false);
  });
});
