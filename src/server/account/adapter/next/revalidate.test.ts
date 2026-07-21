// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import { revalidateAccountMutation } from "server/account/adapter/next/revalidate";

describe("revalidateAccountMutation", () => {
  it("只刷新账户页面", () => {
    revalidateAccountMutation();
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.accounts);
  });
});
