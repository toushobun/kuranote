import { describe, expect, it } from "vitest";

import { ledgerCreateErrorCodes } from "server/ledger/errors/ledgerCreate";

import { validateCreateLedgerForm } from "./ledgerCreateForm";

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("baseCurrency", "JPY");
  formData.set("ledgerName", "家庭账本");
  formData.set("memberDisplayColor", "amber");
  formData.set("memberDisplayName", "DENG SONGWEN");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

describe("validateCreateLedgerForm", () => {
  it("返回清理后的账本创建参数", () => {
    expect(
      validateCreateLedgerForm(
        createFormData({
          baseCurrency: " jpy ",
          ledgerName: "  家庭账本  ",
          memberDisplayName: "  淞文  ",
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        baseCurrency: "JPY",
        displayColor: "amber",
        displayName: "淞文",
        ledgerName: "家庭账本",
      },
    });
  });

  it("账本名称为空时返回校验错误", () => {
    expect(
      validateCreateLedgerForm(createFormData({ ledgerName: " " })),
    ).toEqual({
      error: ledgerCreateErrorCodes.nameRequired,
      ok: false,
    });
  });

  it("拒绝项目未支持的货币", () => {
    expect(
      validateCreateLedgerForm(createFormData({ baseCurrency: "AUD" })),
    ).toEqual({
      error: ledgerCreateErrorCodes.currencyInvalid,
      ok: false,
    });
  });

  it("显示名超过长度限制时返回校验错误", () => {
    expect(
      validateCreateLedgerForm(
        createFormData({ memberDisplayName: "a".repeat(101) }),
      ),
    ).toEqual({
      error: ledgerCreateErrorCodes.displayNameTooLong,
      ok: false,
    });
  });

  it("个性色不在预设范围时返回校验错误", () => {
    expect(
      validateCreateLedgerForm(
        createFormData({ memberDisplayColor: "unknown" }),
      ),
    ).toEqual({
      error: ledgerCreateErrorCodes.displayColorInvalid,
      ok: false,
    });
  });
});
