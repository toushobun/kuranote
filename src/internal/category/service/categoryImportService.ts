import { defaultCategoryEmoji } from "config/categoryEmojis";
import type { CategoryType } from "internal/category/entity/categoryType";
import type { CategoryService } from "internal/category/service/categoryService";
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
      const categoryId = await service.create({
        iconName: defaultCategoryEmoji,
        ledgerId,
        name,
        parentId,
        type,
        userId,
      });

      return { categoryId };
    },
    listCategories,
  };
}
