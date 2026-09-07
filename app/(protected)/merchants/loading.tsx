import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { merchantText } from "config/merchantText";
import { LoadingState } from "molecules/ui/LoadingState";
import { SectionCard } from "molecules/ui/SectionCard";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { designTokens } from "theme/theme";

export default function MerchantsLoading() {
  return (
    <>
      <Box aria-hidden sx={fullViewportPageBackgroundSx} />
      <PageShell
        maxWidth="sm"
        sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
      >
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          <PageHeader
            action={
              <Skeleton
                aria-hidden
                height={36}
                sx={{ borderRadius: `${designTokens.radius.full}px` }}
                variant="rounded"
                width={112}
              />
            }
            leading={
              <Skeleton
                aria-hidden
                height={40}
                variant="circular"
                width={40}
              />
            }
            subtitle="管理常用商家和头像信息"
            title="商家管理"
            variant="compact"
          />

          <SectionCard
            sx={{ borderRadius: `${designTokens.radius.full}px`, p: 0.75 }}
          >
            <Skeleton
              height={32}
              sx={{ borderRadius: `${designTokens.radius.full}px` }}
              variant="rounded"
            />
          </SectionCard>

          <SectionCard sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography
                  component="h2"
                  sx={{ fontWeight: 800 }}
                  variant="h6"
                >
                  {merchantText.categoryManagement}
                </Typography>
                <Skeleton width={72} />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Skeleton
                  height={56}
                  sx={{ borderRadius: `${designTokens.radius.item}px` }}
                  variant="rounded"
                  width={112}
                />
                <Skeleton
                  height={56}
                  sx={{ borderRadius: `${designTokens.radius.item}px` }}
                  variant="rounded"
                  width={112}
                />
                <Skeleton
                  height={56}
                  sx={{ borderRadius: `${designTokens.radius.item}px` }}
                  variant="rounded"
                  width={112}
                />
              </Stack>
            </Stack>
          </SectionCard>

          <LoadingState description="商家列表读取中，请稍等。" />
        </Stack>
      </PageShell>
    </>
  );
}
