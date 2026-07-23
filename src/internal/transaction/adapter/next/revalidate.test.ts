// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths, transactionEditPagePath } from "config/paths";
import { revalidateTransactionMutation } from "internal/transaction/adapter/next/revalidate";

const mocks = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

describe("revalidateTransactionMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("统一失效交易与账户相关页面", () => {
    revalidateTransactionMutation();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.accounts);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.transactions);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      routePaths.transactionsNew,
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      transactionEditPagePath,
      "page",
    );
  });
});
