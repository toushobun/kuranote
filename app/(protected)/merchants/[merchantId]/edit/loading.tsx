import { LoadingState } from "molecules/ui/LoadingState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantEditLoading() {
  return (
    <PageShell maxWidth="sm">
      <PageHeader subtitle="商家管理 > 编辑商家" title="编辑商家" />
      <LoadingState description="商家信息读取中，请稍等。" />
    </PageShell>
  );
}
