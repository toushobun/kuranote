// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import { revalidateMerchantMutation } from "server/merchant/adapter/next/revalidate";

describe("revalidateMerchantMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("统一刷新商家页面", () => {
    revalidateMerchantMutation();

    expect(revalidatePath).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.merchants);
  });
});
