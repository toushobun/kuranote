import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { DataItemCard, dataItemCardPadding } from "atoms/ui/DataItemCard";
import { SoftCard } from "atoms/ui/SoftCard";
import { categoryPageMessages } from "config/categoryMessages";
import { routePaths } from "config/paths";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";

const categoryLoadingRows = [0, 1, 2] as const;

export default function CategoriesLoadingPage() {
  return (
    <Box
      aria-busy="true"
      aria-label={categoryPageMessages.loading}
      role="status"
    >
      <SettingsPageLayout
        action={
          <Skeleton
            height={30}
            sx={{ borderRadius: `${designTokens.radius.full}px` }}
            variant="rounded"
            width={104}
          />
        }
        back={{
          href: routePaths.settings,
          label: categoryPageMessages.backToSettings,
        }}
        subtitle={<Skeleton sx={{ maxWidth: "100%" }} width={230} />}
        title={categoryPageMessages.title}
      >
        <Stack spacing={2.5}>
          <Skeleton
            height={40}
            variant="rounded"
            sx={{ borderRadius: `${designTokens.radius.full}px` }}
          />
          <Skeleton height={48} variant="rounded" />
          <Skeleton width={160} />

          <Stack spacing={0.9}>
            {categoryLoadingRows.map((row) => (
              <DataItemCard
                disablePadding
                key={row}
                sx={{ px: dataItemCardPadding }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", minHeight: 60, py: 0.75 }}
                >
                  <Skeleton height={34} variant="circular" width={34} />
                  <Skeleton height={38} variant="rounded" width={38} />
                  <Stack spacing={0.75} sx={{ flex: 1 }}>
                    <Skeleton width="42%" />
                    <Skeleton width="28%" />
                  </Stack>
                  <Skeleton height={32} variant="circular" width={32} />
                  <Skeleton height={32} variant="circular" width={32} />
                </Stack>
              </DataItemCard>
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
      </SettingsPageLayout>
    </Box>
  );
}
