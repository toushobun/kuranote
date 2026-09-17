import { describe, expect, it, vi } from "vitest";

import { createCategoryImportService } from "internal/category/service/categoryImportService";
import type { CategoryService } from "internal/category/service/categoryService";

function createService(overrides: Partial<CategoryService> = {}) {
  const create = vi.fn(async () => "category-new");
  const listActiveSummaries = vi.fn(async () => [
    {
      id: "category-1",
      name: "餐饮",
      parent_id: null,
      type: "expense" as const,
    },
    {
      id: "category-2",
      name: "食材",
      parent_id: "category-1",
      type: "expense" as const,
    },
  ]);
  const service = {
    create,
    listActiveSummaries,
    ...overrides,
  } as unknown as CategoryService;

  return {
    create,
    importService: createCategoryImportService(service),
    listActiveSummaries,
  };
}

describe("CategoryImportService", () => {
  it("listCategories 按 CategoryService 摘要映射为导入专用实体", async () => {
    const { importService } = createService();

    const categories = await importService.listCategories({
      ledgerId: "ledger-1",
      userId: "user-1",
    });

    expect(categories).toEqual([
      { id: "category-1", name: "餐饮", parentId: null, type: "expense" },
      {
        id: "category-2",
        name: "食材",
        parentId: "category-1",
        type: "expense",
      },
    ]);
  });

  it("createCategory 委托 Service 写入并直接返回新分类 id，不重新查询", async () => {
    const { create, importService, listActiveSummaries } = createService();

    const result = await importService.createCategory({
      ledgerId: "ledger-1",
      name: "外食",
      parentId: "category-1",
      type: "expense",
      userId: "user-1",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerId: "ledger-1",
        name: "外食",
        parentId: "category-1",
        type: "expense",
        userId: "user-1",
      }),
    );
    expect(result).toEqual({ categoryId: "category-new" });
    expect(listActiveSummaries).not.toHaveBeenCalled();
  });
});
