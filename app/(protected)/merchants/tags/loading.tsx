import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SectionCard } from "molecules/ui/SectionCard";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { designTokens } from "theme/theme";

export default function MerchantTagsLoading() {
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
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Stack spacing={1}>
              <Skeleton height={40} width={144} />
              <Skeleton width={220} />
            </Stack>
            <Skeleton
              height={36}
              sx={{ borderRadius: `${designTokens.radius.full}px` }}
              variant="rounded"
              width={64}
            />
          </Stack>

          <SectionCard sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton height={56} key={index} variant="rounded" />
              ))}
              <Skeleton height={36} variant="rounded" width={112} />
            </Stack>
          </SectionCard>
        </Stack>
      </PageShell>
    </>
  );
}
