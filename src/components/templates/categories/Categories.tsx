import Stack from "@mui/material/Stack";

import { ErrorState } from "molecules/ui/ErrorState";
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
  errorCategoryId: string | null;
  errorMessage: string | null;
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
  errorCategoryId,
  errorMessage,
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

      {errorMessage && !errorCategoryId ? (
        <ErrorState title="分类操作失败" description={errorMessage} />
      ) : null}

      <CategoryList
        archiveCategoryAction={archiveCategoryAction}
        canManageCategories={canManageCategories}
        categories={categories}
        errorCategoryId={errorCategoryId}
        errorMessage={errorMessage}
        reorderCategoryAction={reorderCategoryAction}
        updateCategoryAction={updateCategoryAction}
      />
    </PageShell>
  );
}
