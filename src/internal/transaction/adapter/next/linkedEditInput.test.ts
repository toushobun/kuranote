// @vitest-environment node

import { describe, expect, it } from "vitest";
import { parseLinkedEditActionInput } from "internal/transaction/adapter/next/linkedEditInput";

const firstItemId = "00000000-0000-4000-8000-000000000201";
const secondItemId = "00000000-0000-4000-8000-000000000202";

describe("parseLinkedEditActionInput", () => {
  it("未确认且没有版本字段时返回普通保存信号", () => {
    expect(parseLinkedEditActionInput(new FormData(), [firstItemId])).toEqual({
      confirmSync: false,
      expectedUpdatedAtByItemId: {},
    });
  });

  it("按明细顺序解析确认信号和乐观锁版本", () => {
    const formData = new FormData();
    formData.set("confirmSync", "true");
    formData.append("itemExpectedUpdatedAt", "2026-08-21T01:00:00.000Z");
    formData.append("itemExpectedUpdatedAt", "2026-08-21T10:01:00+09:00");

    expect(
      parseLinkedEditActionInput(formData, [firstItemId, secondItemId]),
    ).toEqual({
      confirmSync: true,
      expectedUpdatedAtByItemId: {
        [firstItemId]: "2026-08-21T01:00:00.000Z",
        [secondItemId]: "2026-08-21T10:01:00+09:00",
      },
    });
  });

  it("拒绝客户端伪造的确认值", () => {
    const formData = new FormData();
    formData.set("confirmSync", "yes");

    expect(parseLinkedEditActionInput(formData, [firstItemId])).toBeNull();
  });

  it("拒绝数量错位或不带时区的版本字段", () => {
    const countMismatch = new FormData();
    countMismatch.append("itemExpectedUpdatedAt", "2026-08-21T01:00:00.000Z");
    expect(
      parseLinkedEditActionInput(countMismatch, [firstItemId, secondItemId]),
    ).toBeNull();

    const invalidTimestamp = new FormData();
    invalidTimestamp.append("itemExpectedUpdatedAt", "2026-08-21T10:00:00");
    expect(
      parseLinkedEditActionInput(invalidTimestamp, [firstItemId]),
    ).toBeNull();
  });
});
