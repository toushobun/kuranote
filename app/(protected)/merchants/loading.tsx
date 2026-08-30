import Box from "@mui/material/Box";

import { LoadingState } from "molecules/ui/LoadingState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantsLoading() {
  return (
    <>
      <Box
        aria-hidden
        sx={{
          backgroundColor: "background.default",
          inset: 0,
          position: "fixed",
          zIndex: -1,
        }}
      />
      <PageShell
        maxWidth="sm"
        sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
      >
        <PageHeader subtitle="管理常用商家和头像信息" title="商家管理" />
        <LoadingState description="商家列表读取中，请稍等。" />
      </PageShell>
    </>
  );
}
