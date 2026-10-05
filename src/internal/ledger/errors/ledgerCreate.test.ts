import { describe, expect, it } from "vitest";

import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
  ledgerCreateLoadErrorMessages,
  ledgerCreateWriteErrorMessages,
} from "./ledgerCreate";

describe("ledgerCreateErrorMessages", () => {
  it("认证失效或账号不可用时返回明确提示", () => {
    expect(ledgerCreateErrorMessages[ledgerCreateErrorCodes.authRequired]).toBe(
      "登录状态已失效，请重新登录。",
    );
    expect(ledgerCreateErrorMessages[ledgerCreateErrorCodes.userInactive]).toBe(
      "当前账号不可用，请联系管理员。",
    );
  });
});

describe("ledgerCreateLoadErrorMessages", () => {
  it("返回创建默认值读取失败提示", () => {
    expect(ledgerCreateLoadErrorMessages).toEqual({
      userProfileLoadFailed: "用户资料加载失败，请稍后重试。",
    });
  });
});

describe("ledgerCreateWriteErrorMessages", () => {
  it("返回账本创建写入失败提示", () => {
    expect(ledgerCreateWriteErrorMessages).toEqual({
      createFailed: "账本创建失败，请稍后重试。",
    });
  });
});
