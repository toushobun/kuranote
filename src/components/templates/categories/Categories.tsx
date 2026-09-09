import Stack from "@mui/material/Stack";

import { CategoryForm } from "organisms/categories/CategoryForm/CategoryForm";
import { CategoryList } from "organisms/categories/CategoryList/CategoryList";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type {
  CategoryAction,
  CategoryActionState,
  CategoryParentOption,
  CategoryReorderAction,
  CategoryTreeItem,
} from "types/categories";

type CategoriesTemplateProps = {
  archiveCategoryAction: CategoryAction;
  archiveState?: CategoryActionState;
  canManageCategories?: boolean;
  categories: CategoryTreeItem[];
  createCategoryAction: CategoryAction;
  createState?: CategoryActionState;
  ledgerName: string;
  onReorderError: (state: CategoryActionState) => void;
  parentOptions: CategoryParentOption[];
  reorderCategoryAction: CategoryReorderAction;
  updateCategoryAction: CategoryAction;
  updateState?: CategoryActionState;
};

export function CategoriesTemplate({
  archiveCategoryAction,
  archiveState,
  canManageCategories = true,
  categories,
  createCategoryAction,
  createState,
  ledgerName,
  onReorderError,
  parentOptions,
  reorderCategoryAction,
  updateCategoryAction,
  updateState,
}: CategoriesTemplateProps) {
  return (
    <PageShell>
      <PageHeader
        action={
          canManageCategories ? (
            <CategoryForm
              createCategoryAction={createCategoryAction}
              createState={createState}
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
        archiveState={archiveState}
        canManageCategories={canManageCategories}
        categories={categories}
        onReorderError={onReorderError}
        reorderCategoryAction={reorderCategoryAction}
        updateCategoryAction={updateCategoryAction}
        updateState={updateState}
      />
    </PageShell>
  );
}
