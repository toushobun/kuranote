import { describe, expect, it } from "vitest";

import {
  currentLedgerErrorCodes,
  getCurrentLedgerErrorMessage,
} from "./currentLedger";

describe("getCurrentLedgerErrorMessage", () => {
  it("返回账本无效提示", () => {
    expect(
      getCurrentLedgerErrorMessage(currentLedgerErrorCodes.ledgerInvalid),
    ).toBe("无法切换到该账本。请确认你仍是该账本成员。");
  });

  it("返回切换失败提示", () => {
    expect(
      getCurrentLedgerErrorMessage(currentLedgerErrorCodes.updateFailed),
    ).toBe("账本切换失败，请稍后重试。");
  });

  it("未知或空错误码返回 null", () => {
    expect(getCurrentLedgerErrorMessage("unknown")).toBeNull();
    expect(getCurrentLedgerErrorMessage()).toBeNull();
  });
});
