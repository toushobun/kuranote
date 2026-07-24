// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerSwitchResultValues, routePaths } from "config/paths";
import { currentLedgerErrorCodes } from "internal/ledger/errors/currentLedger";
import { NotFoundError } from "internal/shared/errors/appError";
import type { CurrentLedgerActionState } from "types/ledgers";

import { updateCurrentLedger } from "internal/ledger/adapter/next/actions/currentLedger";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateLedgerMutation: vi.fn(),
  switchService: vi.fn(),
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
    ledger: { currentLedgerService: { switch: mocks.switchService } },
  }),
}));

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";

function createFormData(value: string) {
  const formData = new FormData();
  formData.set("ledgerId", value);
  return formData;
}

function runAction(value: string) {
  return updateCurrentLedger({}, createFormData(value));
}

function expectErrorState(
  state: CurrentLedgerActionState,
  message: string,
) {
  expect(state).toEqual({
    error: message,
    errorKey: expect.any(String),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.requireCurrentUserAndLedger.mockResolvedValue({ userId });
  mocks.switchService.mockResolvedValue(undefined);
});

describe("updateCurrentLedger", () => {
  it("账本 ID 非法时返回当前页错误状态", async () => {
    const state = await runAction("bad-id");

    expectErrorState(
      state,
      "无法切换到该账本。请确认你仍是该账本成员。",
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.switchService).not.toHaveBeenCalled();
  });

  it("Service 抛出应用错误时保留安全文案", async () => {
    mocks.switchService.mockRejectedValue(
      new NotFoundError(
        currentLedgerErrorCodes.ledgerInvalid,
        "无法切换到该账本。请确认你仍是该账本成员。",
      ),
    );

    const state = await runAction(ledgerId);

    expectErrorState(
      state,
      "无法切换到该账本。请确认你仍是该账本成员。",
    );
    expect(mocks.switchService).toHaveBeenCalledWith({ ledgerId, userId });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("未知异常时记录安全日志并返回通用提示", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.switchService.mockRejectedValue(new Error("database unavailable"));

    const state = await runAction(ledgerId);

    expectErrorState(state, "账本切换失败，请稍后重试。");
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] current ledger switch failed unexpectedly",
      { errorName: "Error" },
    );
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("依赖初始化失败时返回安全提示且不调用 Service", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createDependencies.mockRejectedValueOnce(new Error("unavailable"));

    const state = await runAction(ledgerId);

    expectErrorState(state, "账本切换失败，请稍后重试。");
    expect(mocks.switchService).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      "[ledger] current ledger switch failed unexpectedly",
      { errorName: "Error" },
    );
    consoleError.mockRestore();
  });

  it("登录跳转保持原有 Next.js 控制流", async () => {
    mocks.requireCurrentUserAndLedger.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login"),
    );

    await expect(runAction(ledgerId)).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mocks.createDependencies).not.toHaveBeenCalled();
    expect(mocks.switchService).not.toHaveBeenCalled();
  });

  it("更新成功后刷新依赖当前账本的页面并返回成功状态", async () => {
    await expect(runAction(ledgerId)).rejects.toThrow(
      `NEXT_REDIRECT:${routePaths.ledgers}?result=switched`,
    );

    expect(mocks.switchService).toHaveBeenCalledWith({ ledgerId, userId });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      `${routePaths.ledgers}?result=${ledgerSwitchResultValues.switched}`,
    );
  });
});
