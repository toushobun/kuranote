import Stack from "@mui/material/Stack";

import { CategoryForm } from "organisms/categories/CategoryForm/CategoryForm";
import { CategoryList } from "organisms/categories/CategoryList/CategoryList";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type {
  CategoryAction,
  CategoryParentOption,
  CategoryReorderAction,
  CategoryTreeItem,
} from "types/categories";

type CategoriesTemplateProps = {
  archiveCategoryAction: CategoryAction;
  canManageCategories?: boolean;
  categories: CategoryTreeItem[];
  createCategoryAction: CategoryAction;
  ledgerName: string;
  parentOptions: CategoryParentOption[];
  reorderCategoryAction: CategoryReorderAction;
  updateCategoryAction: CategoryAction;
};

export function CategoriesTemplate({
  archiveCategoryAction,
  canManageCategories = true,
  categories,
  createCategoryAction,
  ledgerName,
  parentOptions,
  reorderCategoryAction,
  updateCategoryAction,
}: CategoriesTemplateProps) {
  return (
    <PageShell>
      <PageHeader
        action={
          canManageCategories ? (
            <CategoryForm
              createCategoryAction={createCategoryAction}
              parentOptions={parentOptions}
            />
          ) : null
        }
        title="分类管理"
        subtitle={
          <Stack spacing={0.5}>
            <span>当前账本：{ledgerName}</span>
            <span>整理家庭账本里的收支分类。</span>
          </Stack>
        }
      />

      <CategoryList
        archiveCategoryAction={archiveCategoryAction}
        canManageCategories={canManageCategories}
        categories={categories}
        errorCategoryId={null}
        errorMessage={null}
        reorderCategoryAction={reorderCategoryAction}
        updateCategoryAction={updateCategoryAction}
      />
    </PageShell>
  );
}
