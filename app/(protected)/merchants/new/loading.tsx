import Skeleton from "@mui/material/Skeleton";

import { LoadingState } from "molecules/ui/LoadingState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantCreateLoading() {
  return (
    <PageShell
      maxWidth="sm"
      sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
    >
      <PageHeader
        leading={
          <Skeleton aria-hidden height={40} variant="circular" width={40} />
        }
        subtitle="商家管理 〉 新增商家"
        title="新增商家"
        variant="compact"
      />
      <LoadingState description="新增商家页面准备中，请稍等。" />
    </PageShell>
  );
}
