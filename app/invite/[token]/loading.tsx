import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SoftCard } from "atoms/ui/SoftCard";
import { PageShell } from "templates/layout/PageShell";

export default function LedgerInviteLoadingPage() {
  return (
    <Box aria-busy="true" aria-label="邀请确认页加载中" role="status">
      <Box aria-hidden="true" sx={pageBackgroundSx} />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack spacing={2.5} sx={{ minHeight: "100dvh", py: 2 }}>
          <Skeleton height={40} variant="circular" width={40} />
          <Skeleton height={220} variant="rounded" width="100%" />
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <Skeleton sx={{ fontSize: 34 }} width="66%" />
            <Skeleton sx={{ fontSize: 16 }} width="86%" />
          </Stack>
          <SoftCard sx={{ p: 2.25 }}>
            <Stack spacing={1.5}>
              <Skeleton sx={{ fontSize: 14 }} width="28%" />
              <Skeleton sx={{ fontSize: 24 }} width="58%" />
              <Skeleton height={30} variant="rounded" width={110} />
              <Skeleton sx={{ fontSize: 14 }} width="92%" />
            </Stack>
          </SoftCard>
          <Stack spacing={1.25} sx={{ mt: "auto" }}>
            <Skeleton height={48} variant="rounded" width="100%" />
            <Skeleton height={40} variant="rounded" width="100%" />
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

const pageShellSx = {
  px: { xs: 1.5, sm: 2 },
};
