import { describe, expect, it } from "vitest";

import { validateUpdateLedgerSettingsForm } from "./ledgerSettingsForm";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const memberUserId = "00000000-0000-4000-8000-000000000031";

function createLedgerFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("baseCurrency", "jpy");
  formData.set("intent", "ledger");
  formData.set("ledgerId", ledgerId);
  formData.set("ledgerName", "家庭账本");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function createMemberFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("intent", "member");
  formData.set("ledgerId", ledgerId);
  formData.set("memberDisplayColor", "amber");
  formData.set("memberDisplayName", "DENG SONGWEN");
  formData.set("memberRole", "admin");
  formData.set("memberUserId", memberUserId);

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

describe("ledger settings validators", () => {
  it("账本基础设置表单校验通过", () => {
    expect(validateUpdateLedgerSettingsForm(createLedgerFormData())).toEqual({
      ok: true,
      value: {
        intent: "ledger",
        ledgerId,
        ledgerSettings: {
          baseCurrency: "JPY",
          ledgerName: "家庭账本",
        },
        memberSettings: null,
      },
    });
  });

  it("解析账本特殊状态开关", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createLedgerFormData({ transactionItemSpecialStatusEnabled: "true" }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        ledgerSettings: { transactionItemSpecialStatusEnabled: true },
      },
    });
  });

  it("成员设置表单校验通过", () => {
    expect(validateUpdateLedgerSettingsForm(createMemberFormData())).toEqual({
      ok: true,
      value: {
        intent: "member",
        ledgerId,
        ledgerSettings: null,
        memberSettings: {
          displayColor: "amber",
          displayName: "DENG SONGWEN",
          role: "admin",
          userId: memberUserId,
        },
      },
    });
  });

  it("拒绝非法账本 ID", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createLedgerFormData({ ledgerId: "invalid" }),
      ),
    ).toEqual({
      error: "ledger_invalid",
      ok: false,
    });
  });

  it("拒绝非法提交意图", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createLedgerFormData({ intent: "invalid" }),
      ),
    ).toEqual({
      error: "update_failed",
      ok: false,
    });
  });

  it("拒绝空账本名称", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createLedgerFormData({ ledgerName: "  " }),
      ),
    ).toEqual({
      error: "name_required",
      ok: false,
    });
  });

  it("拒绝非法默认货币", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createLedgerFormData({ baseCurrency: "jp" }),
      ),
    ).toEqual({
      error: "currency_invalid",
      ok: false,
    });
  });

  it("拒绝空成员显示名", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createMemberFormData({ memberDisplayName: "" }),
      ),
    ).toEqual({
      error: "display_name_required",
      ok: false,
    });
  });

  it("拒绝非法个性色", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createMemberFormData({ memberDisplayColor: "invalid" }),
      ),
    ).toEqual({
      error: "display_color_invalid",
      ok: false,
    });
  });

  it("拒绝非法成员权限", () => {
    expect(
      validateUpdateLedgerSettingsForm(
        createMemberFormData({ memberRole: "invalid" }),
      ),
    ).toEqual({
      error: "role_invalid",
      ok: false,
    });
  });
});
