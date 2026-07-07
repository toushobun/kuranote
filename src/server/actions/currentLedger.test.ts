import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { currentLedgerErrorCodes } from "server/errors/currentLedger";

import { updateCurrentLedger } from "./currentLedger";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidatePath: vi.fn(),
  updateCurrentLedgerService: vi.fn(),
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

vi.mock("server/services/currentLedger", () => ({
  updateCurrentLedgerService: mocks.updateCurrentLedgerService,
}));

const userId = "00000000-0000-4000-8000-000000000031";
const ledgerId = "00000000-0000-4000-8000-000000000032";

function createFormData(value: string) {
  const formData = new FormData();
  formData.set("ledgerId", value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { baseCurrency: "JPY", id: ledgerId, name: "家庭账本" },
    userId,
  });
  mocks.updateCurrentLedgerService.mockResolvedValue({ ok: true });
});

describe("updateCurrentLedger", () => {
  it("账本 ID 非法时跳转账本列表错误状态", async () => {
    await expect(updateCurrentLedger(createFormData("bad-id"))).rejects.toThrow(
      `NEXT_REDIRECT:${routePaths.ledgers}?error=${currentLedgerErrorCodes.ledgerInvalid}`,
    );

    expect(mocks.updateCurrentLedgerService).not.toHaveBeenCalled();
  });

  it("更新失败时跳转账本列表错误状态", async () => {
    mocks.updateCurrentLedgerService.mockResolvedValue({
      error: currentLedgerErrorCodes.updateFailed,
      ok: false,
    });

    await expect(updateCurrentLedger(createFormData(ledgerId))).rejects.toThrow(
      `NEXT_REDIRECT:${routePaths.ledgers}?error=${currentLedgerErrorCodes.updateFailed}`,
    );

    expect(mocks.updateCurrentLedgerService).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
  });

  it("更新成功后刷新依赖当前账本的页面并返回账本列表", async () => {
    await expect(updateCurrentLedger(createFormData(ledgerId))).rejects.toThrow(
      `NEXT_REDIRECT:${routePaths.ledgers}`,
    );

    expect(mocks.updateCurrentLedgerService).toHaveBeenCalledWith({
      ledgerId,
      userId,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.dashboard);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.transactions);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      routePaths.transactionsNew,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      routePaths.transactionsSearch,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.accounts);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.categories);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.merchants);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.statistics);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.settings);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.ledgers);
  });
});
