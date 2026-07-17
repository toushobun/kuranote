import { getCurrentLedgerOrRedirect } from "lib/ledger/current-ledger";
import {
  archiveCategory,
  createCategory,
  reorderCategories,
  updateCategory,
} from "server/actions/categories";
import { createRequestContainer } from "server/container";
import { createServerRequestDependencies } from "server/shared/context/createServerRequestDependencies";
import { CategoriesTemplate } from "templates/categories/Categories";
import { getCategoryErrorMessage } from "utils/pageErrors";

export default async function CategoriesRoute({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; error?: string }>;
}) {
  const params = await searchParams;

  // redirect() 属于页面边界，保留在这里；Service 不感知 Next.js 导航行为。
  const currentLedger = await getCurrentLedgerOrRedirect();
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const view = await container.category.service.getCategoriesView({
    ledgerId: currentLedger.id,
    ledgerName: currentLedger.name,
    role: currentLedger.currentUserRole,
  });

  return (
    <CategoriesTemplate
      {...view}
      archiveCategoryAction={archiveCategory}
      createCategoryAction={createCategory}
      errorCategoryId={params.categoryId ?? null}
      errorMessage={getCategoryErrorMessage(params.error)}
      reorderCategoryAction={reorderCategories}
      updateCategoryAction={updateCategory}
    />
  );
}
