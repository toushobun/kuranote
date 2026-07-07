import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SoftCard } from "atoms/ui/SoftCard";
import { PageShell } from "templates/layout/PageShell";

const accountLoadingRows = 4;

export default function AccountsLoadingPage() {
  return (
    <Box aria-busy="true" aria-label="账户数据加载中" role="status">
      <Box aria-hidden="true" sx={pageBackgroundSx} />
      <PageShell maxWidth="xs">
        <Stack spacing={1.35}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Skeleton height={40} variant="circular" width={40} />
            <Stack spacing={0.5} sx={{ flex: 1 }}>
              <Skeleton sx={{ fontSize: 26 }} width="42%" />
              <Skeleton sx={{ fontSize: 14 }} width="78%" />
            </Stack>
            <Skeleton height={40} variant="rounded" width={112} />
          </Stack>

          <SoftCard sx={{ borderRadius: 1, p: { xs: 1.8, sm: 2 } }}>
            <Stack spacing={1.5}>
              <Stack spacing={0.5}>
                <Skeleton sx={{ fontSize: 14 }} width="24%" />
                <Skeleton sx={{ fontSize: 30 }} width="58%" />
              </Stack>
              <Skeleton />
              <Stack direction="row" spacing={2}>
                <Skeleton height={38} variant="rounded" width="42%" />
                <Skeleton height={38} variant="rounded" width="42%" />
              </Stack>
            </Stack>
          </SoftCard>

          <Stack direction="row" spacing={0.7}>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton height={32} key={index} variant="rounded" width={58} />
            ))}
          </Stack>

          <Stack spacing={0.9}>
            {Array.from({ length: accountLoadingRows }, (_, index) => (
              <SoftCard key={index} sx={{ borderRadius: 1, p: 1.5 }}>
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Skeleton height={38} variant="rounded" width={38} />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Skeleton sx={{ fontSize: 17 }} width="62%" />
                    <Skeleton sx={{ fontSize: 14 }} width="48%" />
                  </Stack>
                  <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
                    <Skeleton sx={{ fontSize: 17 }} width={82} />
                    <Skeleton height={24} variant="rounded" width={54} />
                  </Stack>
                </Stack>
              </SoftCard>
            ))}
          </Stack>
        </Stack>
      </PageShell>
    </Box>
  );
}

const pageBackgroundSx = {
  bgcolor: "background.paper",
  inset: 0,
  position: "fixed",
  zIndex: -1,
};
