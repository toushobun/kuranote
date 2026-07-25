import {
  archiveCategory,
  createCategory,
  reorderCategories,
  updateCategory,
} from "internal/category/adapter/next/actions";
import { createRequestContainer } from "internal/container";
import { requireCurrentUserAndLedger } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import { CategoriesActionStateTemplate } from "templates/categories/CategoriesActionState";

export default async function CategoriesRoute() {
  // redirect() 属于页面边界，保留在这里；Service 不感知 Next.js 导航行为。
  const { currentLedger, userId } = await requireCurrentUserAndLedger();
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const view = await container.category.service.getCategoriesView({
    ledgerId: currentLedger.id,
    ledgerName: currentLedger.name,
    userId,
  });

  return (
    <CategoriesActionStateTemplate
      {...view}
      archiveCategoryAction={archiveCategory}
      createCategoryAction={createCategory}
      reorderCategoryAction={reorderCategories}
      updateCategoryAction={updateCategory}
    />
  );
}
