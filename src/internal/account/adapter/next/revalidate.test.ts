// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import { revalidateAccountMutation } from "internal/account/adapter/next/revalidate";

describe("revalidateAccountMutation", () => {
  it("刷新账户、交易记录和仪表盘页面", () => {
    revalidateAccountMutation();
    expect(revalidatePath).toHaveBeenCalledTimes(3);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([
      [routePaths.accounts],
      [routePaths.transactions],
      [routePaths.dashboard],
    ]);
  });
});
