// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerSettingsResultValues, routePaths } from "config/paths";
import { ledgerSettingsErrorCodes } from "internal/ledger/errors/ledgerSettings";
import { AppError } from "internal/shared/errors/appError";
import type { LedgerSettingsActionState } from "types/ledgers";

import { updateLedgerSettings } from "./ledgerSettings";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
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

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));

vi.mock("internal/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
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

function runAction(formData: FormData) {
  return updateLedgerSettings({}, formData);
}

function expectErrorState(state: LedgerSettingsActionState, message: string) {
  expect(state).toEqual({
    error: message,
    errorKey: expect.any(String),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.requireCurrentUserAndLedger.mockResolvedValue({ userId });
  mocks.updateService.mockResolvedValue(undefined);
});

describe("updateLedgerSettings", () => {
  it("表单校验失败时返回可直接展示的错误状态", async () => {
    const state = await runAction(createLedgerFormData({ ledgerName: "" }));

    expectErrorState(state, "请输入账本名称。");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.updateService).not.toHaveBeenCalled();
  });

  it("非法账本 ID 时返回当前页错误状态", async () => {
    const state = await runAction(
      createLedgerFormData({ ledgerId: "invalid" }),
    );

    expectErrorState(state, "账本指定不正确。");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.updateService).not.toHaveBeenCalled();
  });

  it("Service 抛出应用错误时保留安全文案", async () => {
    mocks.updateService.mockRejectedValue(
      new AppError(ledgerSettingsErrorCodes.updateFailed, "更新失败"),
    );

    const state = await runAction(createLedgerFormData());

    expectErrorState(state, "更新失败");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("未知异常时记录安全日志并返回通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.updateService.mockRejectedValue(new Error("database unavailable"));

    const state = await runAction(createLedgerFormData());

    expectErrorState(state, "账本设置保存失败。请确认内容后稍后重试。");
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger settings action failed unexpectedly",
      { errorName: "Error" },
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("依赖初始化失败时返回安全提示且不调用 Service", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createDependencies.mockRejectedValueOnce(new Error("unavailable"));

    const state = await runAction(createLedgerFormData());

    expectErrorState(state, "账本设置保存失败。请确认内容后稍后重试。");
    expect(mocks.updateService).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger settings action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(runAction(createLedgerFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.updateService).not.toHaveBeenCalled();
  });

  it("保存成功后刷新相关页面并返回成功状态", async () => {
    await expect(runAction(createLedgerFormData())).rejects.toThrow(
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
    await expect(runAction(createMemberFormData())).rejects.toThrow(
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
