import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SectionCard } from "molecules/ui/SectionCard";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantEditLoading() {
  return (
    <PageShell
      maxWidth="sm"
      sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
    >
      <PageHeader subtitle="商家管理 > 编辑商家" title="编辑商家" />
      <SectionCard role="status" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Skeleton
              sx={{ height: { xs: 84, sm: 96 }, width: { xs: 84, sm: 96 } }}
              variant="circular"
            />
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Skeleton width="65%" />
              <Skeleton width="90%" />
            </Stack>
          </Stack>
          <Skeleton height={40} variant="rounded" />
          <Skeleton height={40} variant="rounded" />
          <Skeleton height={72} variant="rounded" />
          <Skeleton height={40} variant="rounded" />
        </Stack>
      </SectionCard>
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1}>
          <Skeleton width="30%" />
          <Skeleton width="75%" />
          <Skeleton height={48} variant="rounded" />
          <Skeleton height={48} variant="rounded" />
          <Skeleton height={40} variant="rounded" />
        </Stack>
      </SectionCard>
    </PageShell>
  );
}
