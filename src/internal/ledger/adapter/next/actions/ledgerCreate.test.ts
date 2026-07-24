// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { ledgerCreateErrorCodes } from "internal/ledger/errors/ledgerCreate";
import { AppError } from "internal/shared/errors/appError";
import type { LedgerCreateActionState } from "types/ledgers";

import { createLedger } from "./ledgerCreate";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
  createService: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidateLedgerMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("lib/ledger/current-ledger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("internal/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    ledger: { service: { create: mocks.createService } },
  }),
}));

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

function runAction(formData: FormData) {
  return createLedger({}, formData);
}

function expectErrorState(state: LedgerCreateActionState, message: string) {
  expect(state).toEqual({
    error: message,
    errorKey: expect.any(String),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: null,
    email: "user@example.com",
    ledgers: [],
    userId: "00000000-0000-4000-8000-000000000031",
  });
  mocks.createService.mockResolvedValue(undefined);
});

describe("createLedger", () => {
  it("未创建过账本的登录用户也可以提交创建表单", async () => {
    await expect(runAction(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(mocks.createService).toHaveBeenCalledWith({
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "淞文",
      ledgerName: "家庭账本",
    });
  });

  it("表单校验失败时返回可直接展示的错误状态", async () => {
    const state = await runAction(createFormData({ ledgerName: "" }));

    expectErrorState(state, "请输入账本名称。");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("创建服务返回应用异常时保留对应安全文案", async () => {
    mocks.createService.mockRejectedValue(
      new AppError(
        ledgerCreateErrorCodes.createFailed,
        "账本创建失败。请确认内容后稍后重试。",
      ),
    );

    const state = await runAction(createFormData());

    expectErrorState(state, "账本创建失败。请确认内容后稍后重试。");
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("未知异常时记录安全日志并返回通用提示", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.createService.mockRejectedValue(new Error("database unavailable"));

    const state = await runAction(createFormData());

    expectErrorState(state, "账本创建失败。请确认内容后稍后重试。");
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger create action failed unexpectedly",
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

    const state = await runAction(createFormData());

    expectErrorState(state, "账本创建失败。请确认内容后稍后重试。");
    expect(mocks.createService).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] ledger create action failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.getCurrentLedgerContext.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(runAction(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("创建成功后刷新全部 current ledger 页面并跳转首页", async () => {
    await expect(runAction(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();
    expect(mocks.redirect).toHaveBeenLastCalledWith(routePaths.dashboard);
  });
});
