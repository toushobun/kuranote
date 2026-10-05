import { describe, expect, it } from "vitest";

import { ledgerAccessErrorMessages } from "./ledgerAccess";

describe("ledgerAccessErrorMessages", () => {
  it("返回账本无法访问提示", () => {
    expect(ledgerAccessErrorMessages.ledgerInaccessible).toBe(
      "账本不存在、已归档或您无法访问。",
    );
  });
});
