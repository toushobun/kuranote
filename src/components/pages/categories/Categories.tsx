import {
  archiveCategory,
  createCategory,
  updateCategory,
} from "server/actions/categories";
import { loadCategoriesView } from "server/loaders/categories";
import { CategoriesTemplate } from "templates/categories/Categories";

type CategoriesPageProps = {
  errorCategoryId: string | null;
  errorMessage: string | null;
};

export async function CategoriesPage({
  errorCategoryId,
  errorMessage,
}: CategoriesPageProps) {
  const view = await loadCategoriesView();

  return (
    <CategoriesTemplate
      {...view}
      archiveCategoryAction={archiveCategory}
      createCategoryAction={createCategory}
      errorCategoryId={errorCategoryId}
      errorMessage={errorMessage}
      updateCategoryAction={updateCategory}
    />
  );
}
