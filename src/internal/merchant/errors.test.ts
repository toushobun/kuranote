import { describe, expect, it } from "vitest";

import {
  isMerchantActionErrorCode,
  merchantErrorCodes,
  merchantErrorMessages,
} from "internal/merchant/errors";

describe("merchantErrorMessages", () => {
  it("返回商家与别名校验提示", () => {
    expect(merchantErrorMessages[merchantErrorCodes.nameRequired]).toBe(
      "请输入商家名称。",
    );
    expect(merchantErrorMessages[merchantErrorCodes.aliasInvalid]).toBe(
      "商家别名指定不正确。",
    );
    expect(merchantErrorMessages[merchantErrorCodes.aliasDuplicate]).toBe(
      "商家别名已存在，请修改后重试。",
    );
    expect(merchantErrorMessages[merchantErrorCodes.websiteUrlInvalid]).toBe(
      "网址必须以 http:// 或 https:// 开头。",
    );
  });
});

describe("isMerchantActionErrorCode", () => {
  it("只接受商家 mutation Action 可展示的错误码", () => {
    expect(isMerchantActionErrorCode(merchantErrorCodes.updateFailed)).toBe(
      true,
    );
    expect(isMerchantActionErrorCode(merchantErrorCodes.nameRequired)).toBe(
      true,
    );
    expect(isMerchantActionErrorCode(merchantErrorCodes.aliasDuplicate)).toBe(
      true,
    );
    expect(
      isMerchantActionErrorCode(merchantErrorCodes.merchantReadFailed),
    ).toBe(false);
    expect(isMerchantActionErrorCode("account_update_failed")).toBe(false);
  });
});
