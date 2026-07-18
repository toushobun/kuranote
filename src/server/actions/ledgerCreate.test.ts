// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { ledgerCreateErrorCodes } from "server/errors/ledgerCreate";
import { AppError } from "server/shared/errors/appError";

import { createLedger } from "./ledgerCreate";

const mocks = vi.hoisted(() => ({
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

vi.mock("server/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));

vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: vi.fn().mockResolvedValue({}),
}));

vi.mock("server/container", () => ({
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

beforeEach(() => {
  vi.clearAllMocks();
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
    await expect(createLedger(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(mocks.createService).toHaveBeenCalledWith({
      baseCurrency: "JPY",
      displayColor: "amber",
      displayName: "淞文",
      ledgerName: "家庭账本",
    });
  });

  it("表单校验失败时跳转回创建页面错误状态", async () => {
    await expect(
      createLedger(createFormData({ ledgerName: "" })),
    ).rejects.toThrow("NEXT_REDIRECT:/ledgers/new?");

    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining(`error=${ledgerCreateErrorCodes.nameRequired}`),
    );
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("创建服务失败时显示对应错误", async () => {
    mocks.createService.mockRejectedValue(
      new AppError(ledgerCreateErrorCodes.createFailed, "账本创建失败"),
    );

    await expect(createLedger(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/ledgers/new?",
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining(`error=${ledgerCreateErrorCodes.createFailed}`),
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("创建成功后刷新全部 current ledger 页面并跳转首页", async () => {
    await expect(createLedger(createFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();
    expect(mocks.redirect).toHaveBeenLastCalledWith(routePaths.dashboard);
  });
});
