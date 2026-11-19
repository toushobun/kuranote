import { categoryPageMessages } from "config/categoryMessages";
import { routePaths } from "config/paths";

import { CategoryForm } from "organisms/categories/CategoryForm/CategoryForm";
import { CategoryList } from "organisms/categories/CategoryList/CategoryList";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
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
  onCreateFeedback?: (state: CategoryActionState) => void;
  onReorderError: (state: CategoryActionState) => void;
  parentOptions: CategoryParentOption[];
  reorderCategoryAction: CategoryReorderAction;
  updateCategoryAction: CategoryAction;
  updatePending?: boolean;
  updateState?: CategoryActionState;
};

export function CategoriesTemplate({
  archiveCategoryAction,
  archiveState,
  canManageCategories = true,
  categories,
  createCategoryAction,
  createState,
  onCreateFeedback,
  onReorderError,
  parentOptions,
  reorderCategoryAction,
  updateCategoryAction,
  updatePending,
  updateState,
}: CategoriesTemplateProps) {
  return (
    <SettingsPageLayout
      action={
        canManageCategories ? (
          <CategoryForm
            createCategoryAction={createCategoryAction}
            createState={createState}
            onCreateFeedback={onCreateFeedback}
            parentOptions={parentOptions}
          />
        ) : null
      }
      back={{
        href: routePaths.settings,
        label: categoryPageMessages.backToSettings,
      }}
      subtitle={categoryPageMessages.subtitle}
      title={categoryPageMessages.title}
    >
      <CategoryList
        archiveCategoryAction={archiveCategoryAction}
        archiveState={archiveState}
        canManageCategories={canManageCategories}
        categories={categories}
        onReorderError={onReorderError}
        reorderCategoryAction={reorderCategoryAction}
        updateCategoryAction={updateCategoryAction}
        updatePending={updatePending}
        updateState={updateState}
      />
    </SettingsPageLayout>
  );
}
