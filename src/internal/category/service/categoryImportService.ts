import { defaultCategoryEmoji } from "config/categoryEmojis";
import type { CategoryType } from "internal/category/entity/categoryType";
import type { CategoryService } from "internal/category/service/categoryService";
import { RepositoryError } from "internal/shared/errors/appError";
import { getCategoryDisplayName } from "utils/categoryNames";

export type CategoryImportEntry = {
  id: string;
  name: string;
  parentId: string | null;
  type: CategoryType;
};

export interface CategoryImportService {
  createCategory(input: {
    ledgerId: string;
    name: string;
    parentId: string | null;
    type: CategoryType;
    userId: string;
  }): Promise<{ categoryId: string }>;
  listCategories(input: {
    ledgerId: string;
    userId: string;
  }): Promise<CategoryImportEntry[]>;
}

/** 数据导入模块只依赖这一层窄接口，不直接接触 Category Repository。 */
export function createCategoryImportService(
  service: CategoryService,
): CategoryImportService {
  async function listCategories(input: {
    ledgerId: string;
    userId: string;
  }): Promise<CategoryImportEntry[]> {
    return (await service.listActiveSummaries(input)).map((category) => ({
      id: category.id,
      name: getCategoryDisplayName(category.name, null),
      parentId: category.parent_id,
      type: category.type,
    }));
  }

  return {
    async createCategory({ ledgerId, name, parentId, type, userId }) {
      await service.create({
        iconName: defaultCategoryEmoji,
        ledgerId,
        name,
        parentId,
        type,
        userId,
      });

      const created = (await listCategories({ ledgerId, userId })).find(
        (category) =>
          category.name === name &&
          category.parentId === parentId &&
          category.type === type,
      );

      if (!created) {
        throw new RepositoryError(
          "category_create_failed",
          "分类新增失败，请稍后重试。",
        );
      }

      return { categoryId: created.id };
    },
    listCategories,
  };
}
