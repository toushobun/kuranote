// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  createErrorState,
  createSuccessState,
} from "internal/shared/adapter/next/actionState";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("createErrorState", () => {
  it("只返回错误文案和随机 errorKey", () => {
    const state = createErrorState("保存失败");

    expect(state).toEqual({ error: "保存失败", errorKey: expect.any(String) });
    expect(state.errorKey).toMatch(uuidPattern);
  });

  it("相同文案的连续失败每次生成不同的 errorKey", () => {
    expect(createErrorState("保存失败").errorKey).not.toBe(
      createErrorState("保存失败").errorKey,
    );
  });
});

describe("createSuccessState", () => {
  it("只返回成功文案和随机 successKey", () => {
    const state = createSuccessState("已保存");

    expect(state).toEqual({
      success: "已保存",
      successKey: expect.any(String),
    });
    expect(state.successKey).toMatch(uuidPattern);
  });

  it("相同文案的连续成功每次生成不同的 successKey", () => {
    expect(createSuccessState("已保存").successKey).not.toBe(
      createSuccessState("已保存").successKey,
    );
  });
});
