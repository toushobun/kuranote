// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  parseArchiveAccountForm,
  parseCreateAccountForm,
  parseUpdateAccountForm,
} from "server/account/adapter/next/formParser";
import { accountErrorCodes } from "server/account/errors";

const accountId = "00000000-0000-4000-8000-000000000045";
const holderUserId = "00000000-0000-4000-8000-000000000041";

function createFormData() {
  const formData = new FormData();
  formData.set("accountId", accountId);
  formData.set("name", " 现金 ");
  formData.set("type", "cash");
  formData.set("currency", " jpy ");
  formData.set("initialBalance", "1000.25");
  formData.append("holderUserIds", holderUserId);
  formData.append("holderUserIds", holderUserId);
  return formData;
}

describe("Account form parser", () => {
  it("创建表单规范化名称、货币、持有人和初始余额", () => {
    expect(parseCreateAccountForm(createFormData())).toEqual({
      ok: true,
      value: {
        currency: "JPY",
        holderUserIds: [holderUserId],
        initialBalance: 1000.25,
        name: "现金",
        type: "cash",
      },
    });
  });

  it("创建表单的空初始余额默认按 0 处理", () => {
    const formData = createFormData();
    formData.set("initialBalance", "");

    expect(parseCreateAccountForm(formData)).toEqual({
      ok: true,
      value: expect.objectContaining({ initialBalance: 0 }),
    });
  });

  it("拒绝超过两位小数、非法货币和空持有人", () => {
    const invalidBalance = createFormData();
    invalidBalance.set("initialBalance", "1.234");
    expect(parseCreateAccountForm(invalidBalance)).toEqual({
      error: accountErrorCodes.initialBalanceInvalid,
      ok: false,
    });

    const invalidCurrency = createFormData();
    invalidCurrency.set("currency", "JP");
    expect(parseCreateAccountForm(invalidCurrency)).toEqual({
      error: accountErrorCodes.currencyInvalid,
      ok: false,
    });

    const invalidHolders = createFormData();
    invalidHolders.delete("holderUserIds");
    expect(parseCreateAccountForm(invalidHolders)).toEqual({
      error: accountErrorCodes.holderInvalid,
      ok: false,
    });
  });

  it("更新和归档表单拒绝非法账户 ID", () => {
    const formData = createFormData();
    formData.set("accountId", "invalid");

    expect(parseUpdateAccountForm(formData)).toEqual({
      error: accountErrorCodes.accountInvalid,
      ok: false,
    });
    expect(parseArchiveAccountForm(formData)).toEqual({
      error: accountErrorCodes.accountInvalid,
      ok: false,
    });
  });
});
