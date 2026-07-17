import { canManageMasterData } from "lib/ledger/permissions";
import type { CurrentLedgerRole } from "lib/ledger/current-ledger";
import type { CategoryRepository } from "server/category/repository/categoryRepository";
import type {
  CategoriesViewData,
  CategoryRow,
  CategoryTreeItem,
} from "types/categories";

export type CategoriesView = CategoriesViewData & {
  canManageCategories: boolean;
};

export type CategoryServiceDependencies = {
  categoryRepository: CategoryRepository;
};

export type CategoryService = {
  getCategoriesView(input: {
    ledgerId: string;
    ledgerName: string;
    role: CurrentLedgerRole;
  }): Promise<CategoriesView>;
};

function buildCategoryTree(categories: CategoryRow[]): CategoryTreeItem[] {
  const roots: CategoryTreeItem[] = categories
    .filter((category) => category.parent_id === null)
    .map((category) => ({ ...category, children: [] }));
  const rootById = new Map(roots.map((category) => [category.id, category]));

  for (const category of categories) {
    if (category.parent_id === null) continue;

    rootById.get(category.parent_id)?.children.push(category);
  }

  return roots;
}

/**
 * Category 模块 UseCase。资源级权限判断（canManageCategories）独立成立，
 * 不假设调用方一定经过 Router middleware——Server Component 会直接调用。
 */
export function createCategoryService({
  categoryRepository,
}: CategoryServiceDependencies): CategoryService {
  return {
    async getCategoriesView({ ledgerId, ledgerName, role }) {
      const categories =
        await categoryRepository.findActiveByLedgerId(ledgerId);
      const roots = buildCategoryTree(categories);

      return {
        canManageCategories: canManageMasterData(role),
        categories: roots,
        ledgerName,
        parentOptions: roots.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
        })),
      };
    },
  };
}
