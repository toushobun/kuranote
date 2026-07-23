// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";

import { routePaths } from "config/paths";
import { revalidateCategoryMutation } from "internal/category/adapter/next/revalidate";

describe("revalidateCategoryMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("只失效分类管理页面", () => {
    revalidateCategoryMutation();

    expect(revalidatePath).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith(routePaths.categories);
  });
});
