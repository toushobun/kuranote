import { describe, expect, it } from "vitest";

import { ledgerCreateErrorCodes } from "internal/ledger/errors/ledgerCreate";
import { ledgerSetupErrorCodes } from "internal/ledger/errors/ledgerSetup";

import { validateLedgerSetupBasicInfoForm } from "./ledgerSetupBasicInfoForm";

const ledgerId = "00000000-0000-4000-8000-000000000001";

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("baseCurrency", "JPY");
  formData.set("ledgerName", "家庭账本");
  formData.set("memberDisplayColor", "amber");
  formData.set("memberDisplayName", "淞文");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

const basicInfo = {
  baseCurrency: "JPY",
  displayColor: "amber",
  displayName: "淞文",
  ledgerName: "家庭账本",
};

describe("validateLedgerSetupBasicInfoForm", () => {
  it("没有账本 ID 时解析为创建", () => {
    expect(validateLedgerSetupBasicInfoForm(createFormData())).toEqual({
      ok: true,
      value: { ...basicInfo, ledgerId: null },
    });
  });

  it("有账本 ID 时解析为更新", () => {
    expect(
      validateLedgerSetupBasicInfoForm(createFormData({ ledgerId })),
    ).toEqual({ ok: true, value: { ...basicInfo, ledgerId } });
  });

  it("基本信息校验沿用账本创建表单", () => {
    expect(
      validateLedgerSetupBasicInfoForm(createFormData({ ledgerName: "" })),
    ).toEqual({ error: ledgerCreateErrorCodes.nameRequired, ok: false });
  });

  it("账本 ID 不是 UUID 时视为创建中账本不存在", () => {
    expect(
      validateLedgerSetupBasicInfoForm(createFormData({ ledgerId: "x" })),
    ).toEqual({ error: ledgerSetupErrorCodes.notFound, ok: false });
  });
});
