// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { routePaths } from "config/paths";
import { revalidateTransactionColorSchemeMutation } from "internal/user/adapter/next/revalidate";

const mocks = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

describe("revalidateTransactionColorSchemeMutation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("只失效设置页", () => {
    revalidateTransactionColorSchemeMutation();

    expect(mocks.revalidatePath).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(routePaths.settings);
  });
});
