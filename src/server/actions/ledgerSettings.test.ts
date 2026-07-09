import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerSettingsResultValues } from "config/paths";
import { ledgerSettingsErrorCodes } from "server/errors/ledgerSettings";

import { updateLedgerSettings } from "./ledgerSettings";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidatePath: vi.fn(),
  updateLedgerSettingsService: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("server/context/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));

vi.mock("server/services/ledgerSettings", () => ({
  updateLedgerSettingsService: mocks.updateLedgerSettingsService,
}));

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";
const memberUserId = "00000000-0000-4000-8000-000000000034";

function createLedgerFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("baseCurrency", "JPY");
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
  formData.set("memberDisplayName", "配偶");
  formData.set("memberRole", "admin");
  formData.set("memberUserId", memberUserId);

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { baseCurrency: "JPY", id: ledgerId, name: "家庭账本" },
    userId,
  });
  mocks.updateLedgerSettingsService.mockResolvedValue({ ok: true });
});

describe("updateLedgerSettings", () => {
  it("表单校验失败时跳转到账本设置错误状态", async () => {
    await expect(
      updateLedgerSettings(createLedgerFormData({ ledgerName: "" })),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining(`error=${ledgerSettingsErrorCodes.nameRequired}`),
    );
    expect(mocks.updateLedgerSettingsService).not.toHaveBeenCalled();
  });

  it("非法账本 ID 时直接返回账本列表", async () => {
    await expect(
      updateLedgerSettings(createLedgerFormData({ ledgerId: "invalid" })),
    ).rejects.toThrow("NEXT_REDIRECT:/ledgers");

    expect(mocks.updateLedgerSettingsService).not.toHaveBeenCalled();
  });

  it("保存失败时跳转到账本设置错误状态", async () => {
    mocks.updateLedgerSettingsService.mockResolvedValue({
      error: ledgerSettingsErrorCodes.updateFailed,
      ok: false,
    });

    await expect(updateLedgerSettings(createLedgerFormData())).rejects.toThrow(
      "NEXT_REDIRECT:",
    );

    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining(`error=${ledgerSettingsErrorCodes.updateFailed}`),
    );
  });

  it("保存成功后刷新相关页面并返回成功状态", async () => {
    await expect(updateLedgerSettings(createLedgerFormData())).rejects.toThrow(
      `NEXT_REDIRECT:/ledgers/${ledgerId}/settings?result=${ledgerSettingsResultValues.updated}`,
    );

    expect(mocks.updateLedgerSettingsService).toHaveBeenCalledWith({
      ledgerId,
      ledgerSettings: {
        baseCurrency: "JPY",
        ledgerName: "家庭账本",
      },
      memberSettings: null,
      userId,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ledgers");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/ledgers/${ledgerId}/settings`,
    );
  });

  it("成员设置表单保存时传递成员信息", async () => {
    await expect(updateLedgerSettings(createMemberFormData())).rejects.toThrow(
      "NEXT_REDIRECT:",
    );

    expect(mocks.updateLedgerSettingsService).toHaveBeenCalledWith({
      ledgerId,
      ledgerSettings: null,
      memberSettings: {
        displayColor: "amber",
        displayName: "配偶",
        role: "admin",
        userId: memberUserId,
      },
      userId,
    });
  });
});
