import { describe, expect, it } from "vitest";

import {
  categoryErrorCodes,
  categoryErrorMessages,
} from "internal/category/errors";

describe("category errors", () => {
  it("返回分类校验与业务错误的安全文案", () => {
    expect(categoryErrorMessages[categoryErrorCodes.nameRequired]).toBe(
      "请输入分类名称。",
    );
    expect(categoryErrorMessages[categoryErrorCodes.permissionDenied]).toBe(
      "只有账本所有者或管理员可以维护分类。",
    );
    expect(categoryErrorMessages[categoryErrorCodes.reorderConflict]).toBe(
      "分类列表已发生变化，请刷新页面后重试。",
    );
  });
});
