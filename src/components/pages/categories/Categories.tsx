import { loadCategoriesView } from "server/loaders/categories";
import { CategoriesTemplate } from "categories-template/Categories";

export async function CategoriesPage() {
  const view = await loadCategoriesView();

  return <CategoriesTemplate {...view} />;
}
