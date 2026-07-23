import { describe, expect, it } from "vitest";

import { accountErrorCodes } from "internal/account";
import { categoryErrorCodes } from "internal/category";
import {
  currentLedgerErrorCodes,
  ledgerSettingsErrorCodes,
} from "internal/ledger";
import { transactionErrorCodes } from "internal/transaction";
import { merchantErrorCodes } from "internal/merchant";

import {
  getAccountErrorMessage,
  getCategoryErrorMessage,
  getCurrentLedgerErrorMessage,
  getEditTransactionErrorMessage,
  getLedgerSettingsErrorMessage,
  getMerchantErrorMessage,
  getNewTransactionErrorMessage,
  getTransactionErrorMessage,
} from "./pageErrors";
import {
  editTransactionPageErrorMessages,
  newTransactionPageErrorMessages,
  transactionListPageErrorMessages,
} from "./transactionMessages";

describe("pageErrors", () => {
  it("使用统一错误码映射账户错误提示", () => {
    expect(getAccountErrorMessage(accountErrorCodes.nameRequired)).toBe(
      "请输入账户名称。",
    );
    expect(getAccountErrorMessage(accountErrorCodes.createFailed)).toBe(
      "账户新增失败。请确认账户名称是否重复，或稍后重试。",
    );
  });

  it("使用统一错误码映射分类错误提示", () => {
    expect(getCategoryErrorMessage(categoryErrorCodes.parentInvalid)).toBe(
      "大分类指定不正确。",
    );
    expect(getCategoryErrorMessage(categoryErrorCodes.updateFailed)).toBe(
      "分类更新失败。请确认分类名称是否重复，或稍后重试。",
    );
  });

  it("使用统一错误码映射账本切换错误提示", () => {
    expect(
      getCurrentLedgerErrorMessage(currentLedgerErrorCodes.ledgerInvalid),
    ).toBe("无法切换到该账本。请确认你仍是该账本成员。");
    expect(
      getCurrentLedgerErrorMessage(currentLedgerErrorCodes.updateFailed),
    ).toBe("账本切换失败，请稍后重试。");
  });

  it("使用统一错误码映射账本设置错误提示", () => {
    expect(
      getLedgerSettingsErrorMessage(ledgerSettingsErrorCodes.authRequired),
    ).toBe("登录状态已失效，请重新登录。");
    expect(
      getLedgerSettingsErrorMessage(ledgerSettingsErrorCodes.permissionDenied),
    ).toBe("你没有权限修改该账本或成员设置。");
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

  it("使用统一错误码映射交易错误提示", () => {
    expect(
      getNewTransactionErrorMessage(transactionErrorCodes.amountInvalid),
    ).toBe(newTransactionPageErrorMessages.amountInvalid);
    expect(getTransactionErrorMessage(transactionErrorCodes.voidInvalid)).toBe(
      transactionListPageErrorMessages.voidInvalid,
    );
    expect(
      getEditTransactionErrorMessage(transactionErrorCodes.updateInvalid),
    ).toBe(editTransactionPageErrorMessages.updateInvalid);
    expect(
      getTransactionErrorMessage(transactionErrorCodes.updateInvalid),
    ).toBeNull();
  });

  it("空值或未知错误码返回 null", () => {
    expect(getAccountErrorMessage()).toBeNull();
    expect(getCurrentLedgerErrorMessage("unknown")).toBeNull();
    expect(getTransactionErrorMessage("unknown")).toBeNull();
  });
});
