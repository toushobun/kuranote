import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

import { categoryPageMessages } from "config/categoryMessages";
import { routePaths } from "config/paths";

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
        leading={
          <IconButton
            aria-label={categoryPageMessages.backToSettings}
            component={Link}
            href={routePaths.settings}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        }
        title={categoryPageMessages.title}
        subtitle={categoryPageMessages.subtitle(ledgerName)}
        variant="compact"
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
