import { LoadingState } from "molecules/ui/LoadingState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantCreateLoading() {
  return (
    <PageShell maxWidth="sm">
      <PageHeader subtitle="商家管理 > 新增商家" title="新增商家" />
      <LoadingState description="新增商家页面准备中，请稍等。" />
    </PageShell>
  );
}
