// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import { revalidateMerchantMutation } from "internal/merchant/adapter/next/revalidate";

describe("revalidateMerchantMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("统一刷新商家列表与标签管理页面", () => {
    revalidateMerchantMutation();

    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.merchants);
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.merchantsTags);
  });
});
