// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ledgerSwitchResultValues, routePaths } from "config/paths";
import { currentLedgerErrorCodes } from "internal/ledger/errors/currentLedger";
import { NotFoundError } from "internal/shared/errors/appError";

import { updateCurrentLedger } from "internal/ledger/adapter/next/actions/currentLedger";

const mocks = vi.hoisted(() => ({
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
  createServerRequestDependencies: vi.fn().mockResolvedValue({}),
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

function getLastRedirectUrl() {
  const calls = mocks.redirect.mock.calls;
  const href = calls[calls.length - 1]?.[0];

  expect(href).toBeDefined();
  return new URL(href, "http://localhost");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentUserAndLedger.mockResolvedValue({ userId });
  mocks.switchService.mockResolvedValue(undefined);
});

describe("updateCurrentLedger", () => {
  it("账本 ID 非法时跳转账本列表错误状态", async () => {
    await expect(updateCurrentLedger(createFormData("bad-id"))).rejects.toThrow(
      "NEXT_REDIRECT:",
    );

    const redirectUrl = getLastRedirectUrl();
    expect(redirectUrl.pathname).toBe(routePaths.ledgers);
    expect(redirectUrl.searchParams.get("error")).toBe(
      currentLedgerErrorCodes.ledgerInvalid,
    );
    expect(redirectUrl.searchParams.get("errorKey")).toBeTruthy();
    expect(mocks.switchService).not.toHaveBeenCalled();
  });

  it("Service 抛出应用错误时跳转账本列表并携带错误码", async () => {
    mocks.switchService.mockRejectedValue(
      new NotFoundError(
        currentLedgerErrorCodes.ledgerInvalid,
        "账本不存在或您不是该账本成员。",
      ),
    );

    await expect(updateCurrentLedger(createFormData(ledgerId))).rejects.toThrow(
      "NEXT_REDIRECT:",
    );

    const redirectUrl = getLastRedirectUrl();
    expect(redirectUrl.pathname).toBe(routePaths.ledgers);
    expect(redirectUrl.searchParams.get("error")).toBe(
      currentLedgerErrorCodes.ledgerInvalid,
    );
    expect(mocks.switchService).toHaveBeenCalledWith({ ledgerId, userId });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("更新成功后刷新依赖当前账本的页面并返回成功状态", async () => {
    await expect(updateCurrentLedger(createFormData(ledgerId))).rejects.toThrow(
      `NEXT_REDIRECT:${routePaths.ledgers}?result=switched`,
    );

    expect(mocks.switchService).toHaveBeenCalledWith({ ledgerId, userId });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith();

    const redirectUrl = getLastRedirectUrl();
    expect(redirectUrl.pathname).toBe(routePaths.ledgers);
    expect(redirectUrl.searchParams.get("result")).toBe(
      ledgerSwitchResultValues.switched,
    );
  });
});
