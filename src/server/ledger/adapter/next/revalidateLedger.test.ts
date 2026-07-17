// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import {
  currentLedgerRevalidatePaths,
  revalidateLedgerMutation,
} from "server/ledger/adapter/next/revalidateLedger";

describe("revalidateLedgerMutation", () => {
  it("失效当前账本相关的全部路径", () => {
    revalidateLedgerMutation();

    expect(revalidatePath).toHaveBeenCalledTimes(
      currentLedgerRevalidatePaths.length,
    );
    currentLedgerRevalidatePaths.forEach((path) => {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    });
  });
});
