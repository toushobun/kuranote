import { describe, expect, it } from "vitest";

import { accountErrorCodes } from "internal/account";
import { merchantErrorCodes } from "internal/merchant";

import {
  getAccountErrorMessage,
  getMerchantErrorMessage,
} from "./pageErrors";

describe("pageErrors", () => {
  it("使用统一错误码映射账户错误提示", () => {
    expect(getAccountErrorMessage(accountErrorCodes.nameRequired)).toBe(
      "请输入账户名称。",
    );
    expect(getAccountErrorMessage(accountErrorCodes.createFailed)).toBe(
      "账户新增失败。请确认账户名称是否重复，或稍后重试。",
    );
  });

  it("使用统一错误码映射商家错误提示", () => {
    expect(getMerchantErrorMessage(merchantErrorCodes.aliasRequired)).toBe(
      "请输入商家别名。",
    );
    expect(getMerchantErrorMessage(merchantErrorCodes.websiteUrlInvalid)).toBe(
      "商家网址必须以 http:// 或 https:// 开头。",
    );
    expect(
      getMerchantErrorMessage(merchantErrorCodes.ledgerInvalid),
    ).toBeNull();
    expect(
      getMerchantErrorMessage(merchantErrorCodes.merchantReadFailed),
    ).toBeNull();
  });

  it("空值或未知错误码返回 null", () => {
    expect(getAccountErrorMessage()).toBeNull();
    expect(getAccountErrorMessage("unknown")).toBeNull();
  });
});
