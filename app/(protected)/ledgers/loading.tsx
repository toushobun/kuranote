import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SoftCard } from "atoms/ui/SoftCard";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { designTokens } from "theme/theme";

const ledgerLoadingRows = 4;

export default function LedgersLoadingPage() {
  return (
    <Box aria-busy="true" aria-label="账本数据加载中" role="status">
      <Box aria-hidden="true" sx={fullViewportPageBackgroundSx} />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack spacing={1.5}>
          <Stack spacing={0.45}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Skeleton variant="circular">
                <ArrowBackRoundedIcon />
              </Skeleton>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Skeleton sx={{ fontSize: 26 }} width="48%" />
                <Skeleton sx={{ fontSize: 14 }} width="72%" />
              </Stack>
              <Skeleton height={40} variant="rounded" width={118}>
                <AddRoundedIcon />
              </Skeleton>
            </Stack>
          </Stack>

          <SoftCard
            sx={{
              borderRadius: `${designTokens.radius.lg}px`,
              p: { xs: 1.7, sm: 2 },
            }}
          >
            <Stack spacing={1.45}>
              <Stack
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "center" }}
              >
                <Skeleton height={56} variant="circular" width={56} />
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Skeleton sx={{ fontSize: 14 }} width="24%" />
                  <Skeleton sx={{ fontSize: 24 }} width="62%" />
                </Stack>
                <Skeleton height={30} variant="rounded" width={72} />
              </Stack>
              <Skeleton />
              <Stack direction="row" spacing={1.5}>
                <Skeleton sx={{ fontSize: 14 }} width="30%" />
                <Skeleton sx={{ fontSize: 14 }} width="30%" />
                <Skeleton sx={{ fontSize: 14 }} width="30%" />
              </Stack>
            </Stack>
          </SoftCard>

          <Stack spacing={0.8}>
            <Skeleton sx={{ fontSize: 18 }} width="38%" />
            {Array.from({ length: ledgerLoadingRows }, (_, index) => (
              <SoftCard
                key={index}
                sx={{ borderRadius: `${designTokens.radius.lg}px`, p: 1.35 }}
              >
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Skeleton height={46} variant="circular" width={46} />
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Skeleton sx={{ fontSize: 18 }} width="50%" />
                    <Skeleton sx={{ fontSize: 14 }} width="70%" />
                  </Stack>
                  <Skeleton height={26} variant="rounded" width={72} />
                </Stack>
              </SoftCard>
            ))}
          </Stack>
        </Stack>
      </PageShell>
    </Box>
  );
}

const pageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
};
