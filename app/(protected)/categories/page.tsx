import { CategoriesPage } from "categories-page/Categories";
import { getCategoryErrorMessage } from "utils/pageErrors";

export default async function CategoriesRoute({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <CategoriesPage
      errorCategoryId={params.categoryId ?? null}
      errorMessage={getCategoryErrorMessage(params.error)}
    />
  );
}
