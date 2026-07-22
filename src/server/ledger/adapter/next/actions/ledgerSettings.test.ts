// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerSettingsResultValues, routePaths } from "config/paths";
import { ledgerSettingsErrorCodes } from "server/ledger/errors/ledgerSettings";
import { AppError } from "server/shared/errors/appError";

import { updateLedgerSettings } from "./ledgerSettings";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateLedgerMutation: vi.fn(),
  updateService: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("server/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));

vi.mock("server/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: vi.fn().mockResolvedValue({}),
}));

vi.mock("server/container", () => ({
  createRequestContainer: () => ({
    ledger: { settingsService: { update: mocks.updateService } },
  }),
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
  mocks.requireCurrentUserAndLedger.mockResolvedValue({ userId });
  mocks.updateService.mockResolvedValue(undefined);
});

describe("updateLedgerSettings", () => {
  it("表单校验失败时跳转到账本设置错误状态", async () => {
    await expect(
      updateLedgerSettings(createLedgerFormData({ ledgerName: "" })),
    ).rejects.toThrow("NEXT_REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining(`error=${ledgerSettingsErrorCodes.nameRequired}`),
    );
    expect(mocks.updateService).not.toHaveBeenCalled();
  });

  it("非法账本 ID 时直接返回账本列表", async () => {
    await expect(
      updateLedgerSettings(createLedgerFormData({ ledgerId: "invalid" })),
    ).rejects.toThrow("NEXT_REDIRECT:/ledgers");

    expect(mocks.updateService).not.toHaveBeenCalled();
  });

  it("Service 抛出应用错误时跳转到账本设置错误状态", async () => {
    mocks.updateService.mockRejectedValue(
      new AppError(ledgerSettingsErrorCodes.updateFailed, "更新失败"),
    );

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

    expect(mocks.updateService).toHaveBeenCalledWith({
      intent: "ledger",
      ledgerId,
      settings: {
        baseCurrency: "JPY",
        ledgerName: "家庭账本",
      },
      userId,
    });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      `${routePaths.ledgers}/${ledgerId}/settings`,
    ]);
  });

  it("成员设置表单保存时传递成员信息", async () => {
    await expect(updateLedgerSettings(createMemberFormData())).rejects.toThrow(
      "NEXT_REDIRECT:",
    );

    expect(mocks.updateService).toHaveBeenCalledWith({
      intent: "member",
      ledgerId,
      settings: {
        displayColor: "amber",
        displayName: "配偶",
        role: "admin",
        userId: memberUserId,
      },
      userId,
    });
  });
});
