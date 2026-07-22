import { describe, expect, it } from "vitest";

import { categoryErrorCodes } from "server/category/categoryErrors";
import { getCategoryErrorMessage } from "utils/pageErrors";

describe("分类错误提示", () => {
  it("账本失效与分类集合过期使用不同提示", () => {
    expect(getCategoryErrorMessage(categoryErrorCodes.ledgerInvalid)).toBe(
      "账本不存在或已归档。",
    );
    expect(getCategoryErrorMessage(categoryErrorCodes.reorderConflict)).toBe(
      "分类列表已发生变化，请刷新页面后重试。",
    );
  });
});
