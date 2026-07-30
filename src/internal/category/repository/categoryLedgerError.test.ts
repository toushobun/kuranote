// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { categoryErrorCodes } from "internal/category/errors";
import { createSupabaseCategoryRepository } from "internal/category/repository/categoryRepository";
import { NotFoundError } from "internal/shared/errors/appError";
import type { Logger } from "internal/shared/logging/logger";
import { createSupabaseMock } from "test/supabaseMock";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const categoryId = "00000000-0000-4000-8000-000000000101";

function createLogger(): Logger {
  return { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe("分类排序账本失效错误", () => {
  it("ledger_not_found 不复用分类集合过期错误", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "P0002",
          details: "ledger_not_found",
          message: "ledger_not_found",
        },
      },
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.reorder({
        categoryIds: [categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
      }),
    ).rejects.toMatchObject({
      code: categoryErrorCodes.ledgerInvalid,
      message: "账本不存在或已归档。",
      name: NotFoundError.name,
    });
  });

  it("ledger_required 不落入通用排序失败错误", async () => {
    const supabase = createSupabaseMock({
      rpcResponse: {
        error: {
          code: "22023",
          details: "ledger_required",
          message: "ledger_required",
        },
      },
    });
    const repository = createSupabaseCategoryRepository(
      supabase.client as never,
      createLogger(),
    );

    await expect(
      repository.reorder({
        categoryIds: [categoryId],
        ledgerId,
        parentId: null,
        type: "expense",
      }),
    ).rejects.toMatchObject({
      code: categoryErrorCodes.ledgerInvalid,
      message: "账本不存在或已归档。",
      name: NotFoundError.name,
    });
  });
});
