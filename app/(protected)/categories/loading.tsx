import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SoftCard } from "atoms/ui/SoftCard";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

const categoryLoadingRows = [0, 1, 2] as const;

export default function CategoriesLoadingPage() {
  return (
    <Box aria-busy="true" aria-label="分类数据加载中" role="status">
      <PageShell>
        <PageHeader
          action={<Skeleton height={38} variant="rounded" width={118} />}
          subtitle={
            <Stack spacing={0.75}>
              <Skeleton width={180} />
              <Skeleton width={230} />
            </Stack>
          }
          title="分类管理"
        />

        <Stack spacing={2.5} sx={{ mt: 3 }}>
          <Skeleton height={48} variant="rounded" />
          <Skeleton width={160} />

          <Stack spacing={1.5}>
            {categoryLoadingRows.map((row) => (
              <SoftCard key={row} sx={{ px: { xs: 1.25, sm: 2 }, py: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", minHeight: 78, py: 1 }}
                >
                  <Skeleton height={34} variant="circular" width={34} />
                  <Skeleton height={52} variant="rounded" width={52} />
                  <Stack spacing={0.75} sx={{ flex: 1 }}>
                    <Skeleton width="42%" />
                    <Skeleton width="28%" />
                  </Stack>
                  <Skeleton height={32} variant="circular" width={32} />
                  <Skeleton height={32} variant="circular" width={32} />
                </Stack>
              </SoftCard>
            ))}
          </Stack>

          <SoftCard sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Skeleton height={28} variant="circular" width={28} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Skeleton width={110} />
                <Skeleton width={230} />
              </Stack>
            </Stack>
          </SoftCard>
        </Stack>
      </PageShell>
    </Box>
  );
}
