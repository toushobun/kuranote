import { LoadingState } from "molecules/ui/LoadingState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantsLoading() {
  return (
    <PageShell>
      <PageHeader subtitle="正在读取当前账本的商家。" title="商家管理" />
      <LoadingState description="商家列表读取中，请稍等。" />
    </PageShell>
  );
}
