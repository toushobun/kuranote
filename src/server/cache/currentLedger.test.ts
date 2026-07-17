import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  currentLedgerRevalidatePaths,
  revalidateCurrentLedgerPaths,
} from "./currentLedger";
import { revalidateLedgerMutation } from "server/ledger/adapter/next/revalidateLedger";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("current ledger 页面刷新", () => {
  it("是 ledger 模块统一 revalidate 函数的 re-export，不是另一份实现", () => {
    expect(revalidateCurrentLedgerPaths).toBe(revalidateLedgerMutation);
  });

  it("覆盖所有依赖 current ledger 的核心页面", () => {
    expect(currentLedgerRevalidatePaths).toEqual([
      routePaths.dashboard,
      routePaths.transactions,
      routePaths.transactionsNew,
      routePaths.transactionsSearch,
      routePaths.accounts,
      routePaths.categories,
      routePaths.merchants,
      routePaths.statistics,
      routePaths.settings,
      routePaths.ledgers,
    ]);
  });

  it("每个路径只刷新一次", () => {
    revalidateCurrentLedgerPaths();

    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual(
      currentLedgerRevalidatePaths,
    );
  });
});
