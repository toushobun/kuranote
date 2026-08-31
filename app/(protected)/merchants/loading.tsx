import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { LoadingState } from "molecules/ui/LoadingState";
import { SectionCard } from "molecules/ui/SectionCard";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";

export default function MerchantsLoading() {
  return (
    <>
      <Box aria-hidden sx={fullViewportPageBackgroundSx} />
      <PageShell
        maxWidth="sm"
        sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: "flex-start" }}
          >
            <Skeleton
              aria-hidden
              height={40}
              sx={{ flexShrink: 0 }}
              variant="circular"
              width={40}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  color: "var(--user-theme-balance-text)",
                  fontWeight: 900,
                  lineHeight: 1.25,
                }}
              >
                商家管理
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.25 }}
                variant="body2"
              >
                管理常用商家和头像信息
              </Typography>
            </Box>

            <Skeleton
              aria-hidden
              height={36}
              sx={{ borderRadius: 1, flexShrink: 0 }}
              variant="rounded"
              width={112}
            />
          </Stack>

          <SectionCard sx={{ borderRadius: 999, p: 0.75 }}>
            <Skeleton
              height={32}
              sx={{ borderRadius: 999 }}
              variant="rounded"
            />
          </SectionCard>

          <SectionCard sx={{ borderRadius: 3, p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Skeleton width={96} />
                <Skeleton width={72} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Skeleton height={92} variant="rounded" width={86} />
                <Skeleton height={92} variant="rounded" width={86} />
                <Skeleton height={92} variant="rounded" width={86} />
              </Stack>
            </Stack>
          </SectionCard>

          <LoadingState description="商家列表读取中，请稍等。" />
        </Stack>
      </PageShell>
    </>
  );
}
