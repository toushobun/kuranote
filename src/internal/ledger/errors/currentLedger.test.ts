import { describe, expect, it } from "vitest";

import {
  currentLedgerErrorCodes,
  currentLedgerErrorMessages,
  currentLedgerLoadErrorMessages,
  currentLedgerWriteErrorMessages,
} from "./currentLedger";

describe("currentLedgerErrorMessages", () => {
  it("返回账本无效提示", () => {
    expect(
      currentLedgerErrorMessages[currentLedgerErrorCodes.ledgerInvalid],
    ).toBe("无法切换到该账本。请确认你仍是该账本成员。");
  });

  it("返回切换失败提示", () => {
    expect(
      currentLedgerErrorMessages[currentLedgerErrorCodes.updateFailed],
    ).toBe("账本切换失败，请稍后重试。");
  });
});

describe("currentLedgerLoadErrorMessages", () => {
  it("返回账本与成员读取失败提示", () => {
    expect(currentLedgerLoadErrorMessages).toEqual({
      ledgerLoadFailed: "账本信息读取失败，请稍后重试。",
      memberCountLoadFailed: "账本成员数量加载失败，请稍后重试。",
      memberLoadFailed: "账本成员信息读取失败，请稍后重试。",
    });
  });
});

describe("currentLedgerWriteErrorMessages", () => {
  it("返回当前账本写入失败提示", () => {
    expect(currentLedgerWriteErrorMessages).toEqual({
      updateFailed: "当前账本切换失败，请稍后重试。",
    });
  });
});
